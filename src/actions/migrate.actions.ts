"use server";

import sql from 'mssql';
import fs from 'fs';
import path from 'path';

// Define DB config directly or use your environment variables if any
// This is copied from scratch/migrate.js
const configSource = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '!Quoc21101997',
    server: process.env.DB_SERVER || '14.161.44.90',
    port: parseInt(process.env.DB_PORT || '51433'),
    database: 'GPLX_CDB_CSDT_MOTO',
    options: { encrypt: false, trustServerCertificate: true }
};

const configDest = {
    ...configSource,
    database: 'gplx_csdt'
};

async function getColumns(pool: sql.ConnectionPool, tableName: string) {
    const result = await pool.request().query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '${tableName}'
        AND COLUMNPROPERTY(object_id('${tableName}'), COLUMN_NAME, 'IsIdentity') = 0
    `);
    return result.recordset.map(r => r.COLUMN_NAME);
}

function processValue(colName: string, value: any, mappedCourse: string, newMaDK: string, newAnhPath: string, row: any, dvhcLookup: Function) {
    if (colName === 'MaDK') return newMaDK;
    if (colName === 'MaKhoaHoc') return mappedCourse;
    if (colName === 'DuongDanAnh' && value) return newAnhPath;
    if (colName === 'SoGiayCNTN' && typeof value === 'string') return value.substring(0, 20);
    
    if (colName === 'MaCSDT' && value === '79162') return '79106';
    if (colName === 'MaDVNhanHSo' && value === '79162') return '79106';
    if (colName === 'DonViNhanHSo') {
        if (!value || value === '79162') return '79106';
    }
    
    if (colName === 'NoiCT_MaDVQL') {
        let resolved = dvhcLookup(row['NoiCT_MaDVHC'], row['NoiCT_MaDVQL']);
        return resolved !== null ? resolved : null;
    }
    if (colName === 'NoiCT_MaDVHC') {
        let resolved = dvhcLookup(row['NoiCT_MaDVHC'], row['NoiCT_MaDVQL']);
        return resolved !== null ? row['NoiCT_MaDVHC'] : null;
    }
    if (colName === 'NoiTT_MaDVQL') {
        let resolved = dvhcLookup(row['NoiTT_MaDVHC'], row['NoiTT_MaDVQL']);
        return resolved !== null ? resolved : null;
    }
    if (colName === 'NoiTT_MaDVHC') {
        let resolved = dvhcLookup(row['NoiTT_MaDVHC'], row['NoiTT_MaDVQL']);
        return resolved !== null ? row['NoiTT_MaDVHC'] : null;
    }
    
    return value;
}

async function insertRow(pool: sql.ConnectionPool, tableName: string, columns: string[], dataRow: any, mappedCourse: string, newMaDK: string, newAnhPath: string, dvhcLookup: Function) {
    const request = pool.request();
    let fields: string[] = [];
    let params: string[] = [];
    
    if (columns.includes('DonViNhanHSo') && (dataRow['DonViNhanHSo'] === undefined || dataRow['DonViNhanHSo'] === null)) {
        dataRow['DonViNhanHSo'] = '79106';
    }
    
    for (const col of columns) {
        let val = processValue(col, dataRow[col], mappedCourse, newMaDK, newAnhPath, dataRow, dvhcLookup);
        
        if (val !== undefined && val !== null) {
            request.input(col, val);
            fields.push(`[${col}]`);
            params.push(`@${col}`);
        }
    }
    
    const query = `INSERT INTO [${tableName}] (${fields.join(', ')}) VALUES (${params.join(', ')})`;
    await request.query(query);
}

export async function runMigration(courseMapping: { oldCourse: string, newCourse: string }[]) {
    let poolSource: sql.ConnectionPool | null = null;
    let poolDest: sql.ConnectionPool | null = null;
    try {
        const courseMap = courseMapping.reduce((acc, curr) => {
            if (curr.oldCourse && curr.newCourse) {
                acc[curr.oldCourse.trim()] = curr.newCourse.trim();
            }
            return acc;
        }, {} as Record<string, string>);

        if (Object.keys(courseMap).length === 0) {
            throw new Error("Vui lòng nhập ít nhất 1 cặp mã khóa học để map.");
        }

        poolSource = await new sql.ConnectionPool(configSource).connect();
        poolDest = await new sql.ConnectionPool(configDest).connect();
        
        const nlCols = await getColumns(poolDest, 'NguoiLX');
        const hsCols = await getColumns(poolDest, 'NguoiLX_HoSo');
        
        const dvhcRes = await poolDest.request().query('SELECT MaDvhc, MaDVQL FROM DM_DVHC');
        const validDvhc: Record<string, string[]> = {}; 
        for (const r of dvhcRes.recordset) {
            if (!validDvhc[r.MaDvhc]) validDvhc[r.MaDvhc] = [];
            validDvhc[r.MaDvhc].push(r.MaDVQL);
        }
        
        const dvhcLookup = (maDvhc: string, maDvql: string) => {
            if (!maDvhc) return null;
            if (validDvhc[maDvhc] && validDvhc[maDvhc].includes(maDvql)) return maDvql;
            if (validDvhc[maDvhc] && validDvhc[maDvhc].length > 0) return validDvhc[maDvhc][0];
            return null;
        };
        
        const oldCoursesStr = Object.keys(courseMap).map(c => `'${c}'`).join(',');
        
        const nlData = await poolSource.request().query(`
            SELECT n.* FROM NguoiLX n 
            JOIN NguoiLX_HoSo h ON n.MaDK = h.MaDK
            WHERE h.MaKhoaHoc IN (${oldCoursesStr})
        `);
        
        const hsData = await poolSource.request().query(`
            SELECT h.* FROM NguoiLX_HoSo h 
            WHERE h.MaKhoaHoc IN (${oldCoursesStr})
        `);
        
        let successCount = 0;
        let failCount = 0;
        let skippedCount = 0;
        let errors = [];
        
        for (let i = 0; i < hsData.recordset.length; i++) {
            const hsRow = hsData.recordset[i];
            const nlRow = nlData.recordset.find(n => n.MaDK === hsRow.MaDK);
            
            if (!nlRow) {
                continue;
            }
            
            const oldMaDK = hsRow.MaDK;
            const newMaDK = oldMaDK.replace(/^79162/, '79106');
            const oldCourse = hsRow.MaKhoaHoc;
            const newCourse = courseMap[oldCourse];
            
            let newAnhPath = hsRow.DuongDanAnh;
            
            if (hsRow.DuongDanAnh && typeof hsRow.DuongDanAnh === 'string') {
                newAnhPath = hsRow.DuongDanAnh
                    .replace(oldCourse, newCourse)
                    .replace(/79162/g, '79106');
                
                try {
                    const destFolder = path.dirname(newAnhPath);
                    if (!fs.existsSync(destFolder)) {
                        fs.mkdirSync(destFolder, { recursive: true });
                    }
                    if (fs.existsSync(hsRow.DuongDanAnh)) {
                        fs.copyFileSync(hsRow.DuongDanAnh, newAnhPath);
                    }
                } catch(err: any) {
                    // Ignore copy error or log
                }
            }
            
            try {
                // Insert NguoiLX if not exists
                const checkNl = await poolDest.request()
                    .input('MaDK', newMaDK)
                    .query('SELECT 1 FROM NguoiLX WHERE MaDK = @MaDK');
                
                if (checkNl.recordset.length === 0) {
                    await insertRow(poolDest, 'NguoiLX', nlCols, nlRow, newCourse, newMaDK, newAnhPath, dvhcLookup);
                }
                
                // Insert NguoiLX_HoSo if not exists
                const checkHs = await poolDest.request()
                    .input('MaDK', newMaDK)
                    .query('SELECT 1 FROM NguoiLX_HoSo WHERE MaDK = @MaDK');
                
                if (checkHs.recordset.length === 0) {
                    await insertRow(poolDest, 'NguoiLX_HoSo', hsCols, hsRow, newCourse, newMaDK, newAnhPath, dvhcLookup);
                    successCount++;
                } else {
                    skippedCount++;
                }
            } catch(dbErr: any) {
                errors.push(`Lỗi ${newMaDK}: ${dbErr.message}`);
                failCount++;
            }
        }
        
        return {
            success: true,
            message: `Tìm thấy ${hsData.recordset.length} hồ sơ. Chuyển thành công: ${successCount}. Bỏ qua (đã tồn tại): ${skippedCount}. Thất bại: ${failCount}.`,
            errors: errors.slice(0, 10) // Return only first 10 errors
        };
    } catch(err: any) {
        return { success: false, message: err.message };
    } finally {
        if (poolSource) await poolSource.close();
        if (poolDest) await poolDest.close();
    }
}

export async function getCoursePreview(courseId: string, isSource: boolean) {
    if (!courseId) return { success: true, data: [] };
    
    let pool: sql.ConnectionPool | null = null;
    try {
        const conf = isSource ? configSource : configDest;
        pool = await new sql.ConnectionPool(conf).connect();
        
        const result = await pool.request()
            .input('courseId', sql.VarChar, courseId)
            .query(`
                SELECT n.HoVaTen, n.SoCMT as cccd, h.MaDK, n.NgaySinh as dob, h.HangDaoTao as hang, h.DuongDanAnh
                FROM NguoiLX n
                JOIN NguoiLX_HoSo h ON n.MaDK = h.MaDK
                WHERE h.MaKhoaHoc = @courseId
            `);
            
        return { success: true, data: result.recordset };
    } catch(err: any) {
        return { success: false, message: err.message };
    } finally {
        if (pool) await pool.close();
    }
}

export async function saveCourseImages(courseId: string, imagesDict: Record<string, string>) {
    try {
        const dir = path.join(process.cwd(), 'public', 'uploads', 'xml_images');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const filePath = path.join(dir, `${courseId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(imagesDict), 'utf-8');
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}

export async function loadCourseImages(courseId: string) {
    try {
        const filePath = path.join(process.cwd(), 'public', 'uploads', 'xml_images', `${courseId}.json`);
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return { success: true, data: JSON.parse(data) };
        }
        return { success: true, data: {} };
    } catch (err: any) {
        return { success: false, message: err.message, data: {} };
    }
}
