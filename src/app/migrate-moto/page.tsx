"use client";

import React, { useState, useEffect } from 'react';
import { Buffer } from 'buffer';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { runMigration, getCoursePreview } from '@/actions/migrate.actions';
import { Loader2, Plus, Trash2, Eye, Upload, Download } from "lucide-react";

export default function MigrateMotoPage() {
    const [mappings, setMappings] = useState([{ oldCourse: '79162K260001', newCourse: '79106K26A048' }]);
    const [loadingPreviews, setLoadingPreviews] = useState<Record<number, { source: boolean, dest: boolean }>>({});
    const [imageStatus, setImageStatus] = useState<Record<string, boolean>>({});
    
    // Popup state
    const [activePreview, setActivePreview] = useState<{ course: string, type: 'source'|'dest', data: any[] } | null>(null);
    const [xmlImages, setXmlImages] = useState<Record<string, string>>({});
    
    // File upload state
    const [selectedXmlFile, setSelectedXmlFile] = useState<File | null>(null);
    const [isParsingXml, setIsParsingXml] = useState(false);
    const [parseResultMsg, setParseResultMsg] = useState("");
    
    // Search and Sort
    const [searchTerm, setSearchTerm] = useState("");
    const [isZipping, setIsZipping] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const [isMigrating, setIsMigrating] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; errors?: string[] } | null>(null);

    // Debounced check for image existence
    useEffect(() => {
        const checkImages = async () => {
            for (const m of mappings) {
                const courseId = m.oldCourse.trim();
                if (courseId && imageStatus[courseId] === undefined) {
                    try {
                        const res = await fetch(`/api/xml-images?courseId=${courseId}&checkOnly=true`);
                        const data = await res.json();
                        setImageStatus(prev => ({ ...prev, [courseId]: data.exists }));
                    } catch (e) {
                        // ignore
                    }
                }
            }
        };
        const timeout = setTimeout(checkImages, 500);
        return () => clearTimeout(timeout);
    }, [mappings, imageStatus]);

    const handleAddMapping = () => {
        setMappings([...mappings, { oldCourse: '', newCourse: '' }]);
    };

    const handleRemoveMapping = (index: number) => {
        setMappings(mappings.filter((_, i) => i !== index));
    };

    const handleMappingChange = (index: number, field: 'oldCourse' | 'newCourse', value: string) => {
        const newMappings = [...mappings];
        newMappings[index][field] = value;
        setMappings(newMappings);
    };

    const fetchPreview = async (index: number, type: 'source' | 'dest', courseId: string, sourceCourseId: string) => {
        if (!courseId.trim()) return;
        
        setLoadingPreviews(prev => ({ 
            ...prev, 
            [index]: { ...prev[index], [type]: true } 
        }));

        try {
            const res = await getCoursePreview(courseId.trim(), type === 'source');
            if (res.success) {
                setActivePreview({
                    course: courseId.trim(),
                    type,
                    data: res.data || []
                });
                // Try to load saved images using the SOURCE course ID
                const imageTargetCourse = sourceCourseId.trim() || courseId.trim();
                try {
                    const req = await fetch(`/api/xml-images?courseId=${imageTargetCourse}`);
                    const loadRes = await req.json();
                    if (loadRes.success && loadRes.data && Object.keys(loadRes.data).length > 0) {
                        setXmlImages(loadRes.data);
                        setParseResultMsg(`Đã tải ${Object.keys(loadRes.data).length} ảnh đã lưu.`);
                    } else {
                        setXmlImages({}); // clear old xml data
                        setParseResultMsg("");
                    }
                } catch(e) {
                    setXmlImages({});
                    setParseResultMsg("");
                }
            }
        } catch (error) {
            console.error("Lỗi khi tải preview:", error);
        } finally {
            setLoadingPreviews(prev => ({ 
                ...prev, 
                [index]: { ...prev[index], [type]: false } 
            }));
        }
    };

    const handleMigrate = async () => {
        setIsMigrating(true);
        setResult(null);
        try {
            const res = await runMigration(mappings);
            setResult(res);
        } catch (error: any) {
            setResult({ success: false, message: "Lỗi: " + error.message });
        } finally {
            setIsMigrating(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedXmlFile(e.target.files?.[0] || null);
        setParseResultMsg("");
    };

    const processXmlFile = () => {
        if (!selectedXmlFile) return;
        setIsParsingXml(true);
        setParseResultMsg("");

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (text) {
                const images: Record<string, string> = {};
                
                // Find all student blocks (NGUOI_LX or HOC_VIEN)
                const blockRegex = /<(NGUOI_LX|HOC_VIEN|HOCVIEN)\b[^>]*>(.*?)<\/\1>/gis;
                let match;
                
                // Use setTimeout to avoid freezing the UI completely
                setTimeout(async () => {
                    const jpeg2000 = await import('jpeg2000');
                    const { Buffer } = await import('buffer');
                    
                    while ((match = blockRegex.exec(text)) !== null) {
                        const block = match[2];
                        
                        // Match CCCD/CMND or MA_DK
                        const cmtMatch = block.match(/<(SO_CMT|SOCMT|SO_CMND|SOCMND|MA_DK|MADK)[^>]*>(.*?)<\/\1>/is);
                        // Match ANH_CHAN_DUNG
                        const anhMatch = block.match(/<ANH_CHAN_DUNG[^>]*>(.*?)<\/ANH_CHAN_DUNG>/is);
                        
                        if (cmtMatch && cmtMatch[2] && anhMatch && anhMatch[1]) {
                            const cccd = cmtMatch[2].trim();
                            const base64 = anhMatch[1].replace(/\s+/g, '');
                            if (cccd && base64) {
                                try {
                                    // Decode JP2 to JPG immediately
                                    if (base64.startsWith("AAAADGpQICA") || base64.startsWith("0000000c6a502020")) {
                                        // Polyfill Buffer methods for jpeg2000 if needed (because browser slice may return Uint8Array)
                                        if (typeof Uint8Array.prototype.readUInt16BE !== 'function') {
                                            (Uint8Array.prototype as any).readUInt16BE = function(offset = 0) {
                                                return (this[offset] << 8) | this[offset + 1];
                                            };
                                            (Uint8Array.prototype as any).readInt8 = function(offset = 0) {
                                                const val = this[offset];
                                                return val > 127 ? val - 256 : val;
                                            };
                                            (Uint8Array.prototype as any).readUInt32BE = function(offset = 0) {
                                                return ((this[offset] << 24) | (this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3]) >>> 0;
                                            };
                                        }

                                        const bytes = Buffer.from(base64, 'base64');
                                        const img = new jpeg2000.JpxImage();
                                        img.parse(bytes);

                                        const canvas = document.createElement('canvas');
                                        canvas.width = img.width;
                                        canvas.height = img.height;
                                        const ctx = canvas.getContext('2d');
                                        if (ctx) {
                                            const imgData = ctx.createImageData(img.width, img.height);
                                            const rgb = img.tiles[0].items;
                                            const rgba = imgData.data;
                                            for (let i = 0; i < img.width * img.height; i++) {
                                                rgba[i*4] = rgb[i*3];
                                                rgba[i*4+1] = rgb[i*3+1];
                                                rgba[i*4+2] = rgb[i*3+2];
                                                rgba[i*4+3] = 255;
                                            }
                                            ctx.putImageData(imgData, 0, 0);
                                            images[cccd] = {
                                                jpg: canvas.toDataURL('image/jpeg', 0.85),
                                                jp2: base64
                                            };
                                        }
                                    } else {
                                        images[cccd] = {
                                            jpg: base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`
                                        };
                                    }
                                } catch (err) {
                                    console.error("Lỗi parse ảnh:", err);
                                    images[cccd] = {
                                        jp2: base64
                                    };
                                }
                            }
                        }
                    }
                    
                    setXmlImages(images);
                    setParseResultMsg(`Đã tải & xử lý ${Object.keys(images).length} ảnh. Đang lưu tự động...`);
                    
                    if (activePreview?.course) {
                        fetch('/api/xml-images', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ courseId: activePreview.course, imagesDict: images })
                        }).then(res => res.json()).then(res => {
                            if (res.success) {
                                setParseResultMsg(`Tìm thấy và lưu ${Object.keys(images).length} ảnh JPG thành công!`);
                                setImageStatus(prev => ({ ...prev, [activePreview.course]: true }));
                            } else {
                                setParseResultMsg(`Đã tải ${Object.keys(images).length} ảnh (Lỗi lưu: ${res.message})`);
                            }
                        }).catch(e => {
                            setParseResultMsg(`Lỗi lưu tự động.`);
                        });
                    }
                    setIsParsingXml(false);
                }, 100);
            }
        };
        reader.readAsText(selectedXmlFile);
    };

    const handleDownloadZip = async () => {
        if (!activePreview || !activePreview.data.length || Object.keys(xmlImages).length === 0) return;
        setIsZipping(true);
        try {
            const JSZip = (await import('jszip')).default;
            const fileSaver = await import('file-saver');

            const zip = new JSZip();
            let addedCount = 0;

            for (const s of activePreview.data) {
                const imgData = xmlImages[s.cccd] as any;
                if (imgData && s.DuongDanAnh) {
                    try {
                        let b64Data = "";
                        
                        if (typeof imgData === 'string') {
                            b64Data = imgData.startsWith('data:') ? imgData.split(',')[1] : imgData;
                        } else if (imgData.jp2) {
                            b64Data = imgData.jp2; // Prefer raw JP2 for ZIP as required by CSDL
                        } else if (imgData.jpg) {
                            b64Data = imgData.jpg.split(',')[1];
                        }

                        if (b64Data) {
                            // Extract path after IMAGE_GPLX
                            let relPath = s.DuongDanAnh;
                            if (relPath.includes('IMAGE_GPLX')) {
                                relPath = relPath.split('IMAGE_GPLX')[1];
                                if (relPath.startsWith('\\') || relPath.startsWith('/')) relPath = relPath.substring(1);
                            } else {
                                // fallback to courseId/MaDK.jp2
                                relPath = `${activePreview.course}/${s.MaDK}.jp2`;
                            }
                            relPath = relPath.replace(/\\/g, '/'); // JSZip uses forward slashes
                            
                            zip.file(relPath, b64Data, { base64: true });
                            addedCount++;
                        }
                    } catch(e) {
                        console.error("Error adding to zip:", e);
                    }
                }
            }

            if (addedCount > 0) {
                const content = await zip.generateAsync({ type: 'blob' });
                fileSaver.saveAs(content, `images_${activePreview.course}.zip`);
            } else {
                alert("Không có ảnh nào để tải!");
            }
        } catch(e) {
            console.error("Zip error:", e);
            alert("Đã xảy ra lỗi khi tạo file ZIP.");
        } finally {
            setIsZipping(false);
        }
    };

    const handleDownloadExcel = async () => {
        if (!activePreview || !activePreview.data.length) return;
        setIsExporting(true);
        try {
            const ExcelJS = (await import('exceljs')).default;
            const fileSaver = await import('file-saver');

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Danh sách học viên');

            // Columns setup
            worksheet.columns = [
                { header: 'STT', key: 'stt', width: 5 },
                { header: 'Ảnh', key: 'anh', width: 12 },
                { header: 'Họ và tên', key: 'hoten', width: 25 },
                { header: 'Số CCCD', key: 'cccd', width: 18 },
                { header: 'Mã Đăng Ký', key: 'madk', width: 20 },
                { header: 'Ngày sinh', key: 'dob', width: 15 },
                { header: 'Hạng', key: 'hang', width: 10 },
            ];

            // Header styling
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

            let rowIndex = 2; // Data starts at row 2

            // Sort data first
            let displayData = [...activePreview.data].sort((a, b) => (a.MaDK || "").localeCompare(b.MaDK || ""));

            for (let i = 0; i < displayData.length; i++) {
                const s = displayData[i];
                
                // Add text row
                const row = worksheet.addRow({
                    stt: i + 1,
                    hoten: s.HoVaTen,
                    cccd: s.cccd,
                    madk: s.MaDK,
                    dob: s.dob,
                    hang: s.hang
                });
                
                row.height = 55; // Make row taller to fit image
                row.alignment = { vertical: 'middle' };

                // Get image
                const imgData = xmlImages[s.cccd] as any;
                if (imgData) {
                    let b64JPG = "";
                    if (typeof imgData === 'string' && imgData.startsWith('data:image/jpeg')) {
                        b64JPG = imgData;
                    } else if (imgData.jpg) {
                        b64JPG = imgData.jpg;
                    }

                    if (b64JPG) {
                        try {
                            const imageId = workbook.addImage({
                                base64: b64JPG,
                                extension: 'jpeg',
                            });

                            worksheet.addImage(imageId, {
                                tl: { col: 1, row: rowIndex - 1 }, // col 1 is 'Ảnh' (zero-based index), row starts at 0 for row 1
                                ext: { width: 45, height: 60 }
                            });
                        } catch (e) {
                            console.error("Lỗi thêm ảnh vào excel:", e);
                        }
                    }
                }

                rowIndex++;
            }

            const buffer = await workbook.xlsx.writeBuffer();
            fileSaver.saveAs(new Blob([buffer]), `DanhSach_${activePreview.course}.xlsx`);

        } catch (error) {
            console.error("Lỗi tạo Excel:", error);
            alert("Đã xảy ra lỗi khi tạo file Excel.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Chuyển dữ liệu XML Moto</h1>
                    <p className="text-muted-foreground mt-2">
                        Công cụ giúp đồng bộ dữ liệu học viên từ hệ thống XML Moto mới sang CSDL cũ theo mã khóa học.
                    </p>
                </div>

                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-lg">Map Mã Khóa Học</CardTitle>
                        <CardDescription>Nhập các mã khóa học cũ (Moto) tương ứng với mã khóa học mới (CSDT).</CardDescription>
                        <p className="text-sm text-emerald-600 mt-2 bg-emerald-50 p-2 rounded border border-emerald-100 flex items-center gap-2">
                            <Upload className="h-4 w-4" /> 
                            <span>Gợi ý: Để <strong>Upload file XML</strong> (lấy ảnh), vui lòng bấm nút <strong>Xem thử</strong> ở cột Mã Khóa Học Nguồn. Để tải file ZIP ảnh, bấm Xem thử ở cột Đích.</span>
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        {mappings.map((m, idx) => (
                            <div key={idx} className="p-5 border border-slate-200 rounded-xl bg-white space-y-5 shadow-sm relative transition-all hover:shadow-md">
                                {mappings.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 rounded-full"
                                        onClick={() => handleRemoveMapping(idx)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                                
                                <div className="grid grid-cols-2 gap-8 pr-10">
                                    {/* Source Column */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                                            <span>
                                                Mã khóa học (Nguồn - XML)
                                                {m.oldCourse.trim() && imageStatus[m.oldCourse.trim()] && (
                                                    <span className="ml-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                        ✓ Đã lưu ảnh
                                                    </span>
                                                )}
                                            </span>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-7 text-xs font-medium border-slate-300 shadow-sm"
                                                onClick={() => fetchPreview(idx, 'source', m.oldCourse, m.oldCourse)}
                                                disabled={loadingPreviews[idx]?.source || !m.oldCourse}
                                            >
                                                {loadingPreviews[idx]?.source ? <Loader2 className="h-3 w-3 animate-spin mr-1"/> : <Eye className="h-3 w-3 mr-1 text-slate-500"/>}
                                                Xem thử
                                            </Button>
                                        </label>
                                        <Input
                                            placeholder="VD: 79162K260001"
                                            value={m.oldCourse}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                handleMappingChange(idx, 'oldCourse', val);
                                                // Reset status for new input if not checked yet
                                                if (val.trim() && imageStatus[val.trim()] === undefined) {
                                                    setImageStatus(prev => ({ ...prev, [val.trim()]: undefined as unknown as boolean }));
                                                }
                                            }}
                                            className={`bg-slate-50 ${m.oldCourse.trim() && imageStatus[m.oldCourse.trim()] ? 'text-emerald-700 font-semibold border-emerald-300' : ''}`}
                                        />
                                    </div>

                                    {/* Dest Column */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                                            Mã khóa học (Đích - CSDL cũ)
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-7 text-xs font-medium border-slate-300 shadow-sm"
                                                onClick={() => fetchPreview(idx, 'dest', m.newCourse, m.oldCourse)}
                                                disabled={loadingPreviews[idx]?.dest || !m.newCourse}
                                            >
                                                {loadingPreviews[idx]?.dest ? <Loader2 className="h-3 w-3 animate-spin mr-1"/> : <Eye className="h-3 w-3 mr-1 text-slate-500"/>}
                                                Xem thử
                                            </Button>
                                        </label>
                                        <Input
                                            placeholder="VD: 79106K26A048"
                                            value={m.newCourse}
                                            onChange={(e) => handleMappingChange(idx, 'newCourse', e.target.value)}
                                            className="bg-slate-50"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Button variant="outline" size="sm" onClick={handleAddMapping} className="text-blue-700 border-blue-200 hover:bg-blue-50 font-medium bg-blue-50/50">
                            <Plus className="h-4 w-4 mr-1.5" />
                            Thêm dòng map mã khóa học
                        </Button>

                        {result && (
                            <div className={`mt-6 p-4 rounded-xl shadow-sm ${result.success ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'}`}>
                                <p className="font-semibold">{result.message}</p>
                                {result.errors && result.errors.length > 0 && (
                                    <ul className="mt-3 list-disc list-inside text-sm text-red-700 space-y-1.5 bg-white/50 p-3 rounded-lg border border-red-100">
                                        {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                                    </ul>
                                )}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t border-slate-100 py-5">
                        <Button 
                            onClick={handleMigrate} 
                            disabled={isMigrating} 
                            size="lg"
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all"
                        >
                            {isMigrating ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Đang thực hiện chuyển đổi...
                                </>
                            ) : (
                                'Bắt đầu chuyển đổi dữ liệu'
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Preview Modal */}
            <Dialog open={!!activePreview} onOpenChange={(open) => {
                if (!open) {
                    setActivePreview(null);
                    setXmlImages({});
                    setSelectedXmlFile(null);
                    setParseResultMsg("");
                    setSearchTerm("");
                }
            }}>
                <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl border-slate-200 shadow-xl">
                    <DialogHeader className="p-5 border-b border-slate-100 shrink-0 bg-white">
                        <DialogTitle className="text-xl text-slate-800">
                            Danh sách học viên {activePreview?.type === 'source' ? '(Khóa Nguồn - XML)' : '(Khóa Đích - CSDL cũ)'}
                        </DialogTitle>
                        <DialogDescription className="mt-1.5 text-sm text-slate-500">
                            Mã khóa học: <strong className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{activePreview?.course}</strong> 
                            <span className="mx-2">•</span> 
                            Tổng cộng: <strong className="text-slate-800">{activePreview?.data?.length}</strong> học viên
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="bg-slate-50/80 border-b border-slate-200 p-3 px-6 flex items-center justify-between shrink-0 shadow-sm z-20 relative gap-4">
                        <div className="flex items-center gap-3 w-full max-w-xl">
                            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                                <Upload className="h-4 w-4 inline-block mr-1.5 text-slate-400" />
                                File XML:
                            </label>
                            <Input 
                                type="file" 
                                accept=".xml" 
                                onChange={handleFileChange} 
                                className="h-8 text-xs cursor-pointer bg-white flex-1" 
                            />
                            <Button 
                                size="sm" 
                                onClick={processXmlFile}
                                disabled={!selectedXmlFile || isParsingXml}
                                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap"
                            >
                                {isParsingXml ? <Loader2 className="h-3 w-3 animate-spin mr-1"/> : <Eye className="h-3 w-3 mr-1"/>}
                                Đọc ảnh
                            </Button>
                        </div>
                        <div className="flex items-center gap-3">
                            <Input 
                                placeholder="Tìm theo tên, CMND, Mã ĐK..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="h-8 text-sm w-64 bg-white"
                            />
                            {parseResultMsg && (
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-2.5 py-1 rounded-full whitespace-nowrap">
                                    {parseResultMsg}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-auto bg-slate-50 relative">
                        {activePreview?.data?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 italic">
                                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                    <Eye className="h-5 w-5 text-slate-300" />
                                </div>
                                Không tìm thấy dữ liệu học viên nào cho khóa này.
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="text-xs text-slate-500 bg-white uppercase sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-3.5 font-bold">STT</th>
                                        <th className="px-6 py-3.5 font-bold">Ảnh</th>
                                        <th className="px-6 py-3.5 font-bold">Họ và tên</th>
                                        <th className="px-6 py-3.5 font-bold">Số CCCD</th>
                                        <th className="px-6 py-3.5 font-bold">Mã Đăng Ký</th>
                                        <th className="px-6 py-3.5 font-bold">Ngày sinh</th>
                                        <th className="px-6 py-3.5 font-bold">Hạng</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(() => {
                                        let displayData = activePreview?.data || [];
                                        
                                        // Sort by MaDK
                                        displayData = [...displayData].sort((a, b) => (a.MaDK || "").localeCompare(b.MaDK || ""));
                                        
                                        // Filter by search term
                                        if (searchTerm) {
                                            const lowerTerm = searchTerm.toLowerCase();
                                            displayData = displayData.filter(x => 
                                                (x.hoTen || x.HoVaTen || "").toLowerCase().includes(lowerTerm) || 
                                                (x.cccd || "").toLowerCase().includes(lowerTerm) ||
                                                (x.MaDK || "").toLowerCase().includes(lowerTerm)
                                            );
                                        }

                                        return displayData.map((s, i) => {
                                            const base64Img = xmlImages[s.cccd];
                                            return (
                                                <tr key={i} className="bg-white hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-6 py-3 text-slate-500 font-medium">{i + 1}</td>
                                                    <td className="px-6 py-2">
                                                        {base64Img ? (
                                                            <Jp2Image data={base64Img} />
                                                        ) : (
                                                        <div className="w-10 h-12 bg-slate-100 rounded border border-slate-200 border-dashed flex items-center justify-center text-slate-300">
                                                            <UserIcon />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 font-semibold text-slate-800">{s.HoVaTen}</td>
                                                <td className="px-6 py-3 text-slate-600 tabular-nums">{s.cccd}</td>
                                                <td className="px-6 py-3 text-slate-600 font-mono text-xs">{s.MaDK}</td>
                                                <td className="px-6 py-3 text-slate-600">{s.dob}</td>
                                                <td className="px-6 py-3">
                                                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-xs border border-slate-200">
                                                        {s.hang}
                                                    </span>
                                                </td>
                                                </tr>
                                            )
                                        });
                                    })()}
                                </tbody>
                            </table>
                        )}
                    </div>
                    
                    <DialogFooter className="p-4 border-t border-slate-100 bg-white shrink-0 sm:justify-between items-center">
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            {activePreview?.type === 'dest' && Object.keys(xmlImages).length > 0 && (
                                <>
                                    <Button 
                                        variant="default" 
                                        className="bg-emerald-600 hover:bg-emerald-700 font-medium text-white shadow-sm"
                                        onClick={handleDownloadZip}
                                        disabled={isZipping || isExporting}
                                    >
                                        {isZipping ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Download className="h-4 w-4 mr-2" />}
                                        {isZipping ? 'Đang tạo ZIP...' : 'Tải File Ảnh (ZIP)'}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-medium shadow-sm"
                                        onClick={handleDownloadExcel}
                                        disabled={isZipping || isExporting}
                                    >
                                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Download className="h-4 w-4 mr-2" />}
                                        {isExporting ? 'Đang xuất...' : 'Tải Excel (Kèm Ảnh)'}
                                    </Button>
                                </>
                            )}
                        </div>
                        <DialogClose asChild>
                            <Button variant="outline" className="min-w-[100px] font-medium shadow-sm">Đóng</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Jp2Image renders the fast JPG if available, or falls back.
function Jp2Image({ data }: { data: any }) {
    let src = "";
    if (typeof data === 'string') {
        src = data.startsWith('data:') ? data : `data:image/jpeg;base64,${data}`;
    } else if (data?.jpg) {
        src = data.jpg;
    } else if (data?.jp2) {
        src = `data:image/jpeg;base64,${data.jp2}`; // Might be broken but fallback
    }

    return (
        <img 
            src={src} 
            alt="Student" 
            className="w-10 h-12 object-cover rounded border border-slate-200 shadow-sm"
            loading="lazy"
        />
    );
}

function UserIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}
