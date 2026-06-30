import { getCourseDetails } from '../src/actions/courses';
async function test() {
    try {
        const res = await getCourseDetails('79106K26B0106');
        console.log("Result:", res);
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
