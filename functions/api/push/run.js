import { json } from "../../_lib.js";
import { runBatch } from "../../_pushrun.js";
// 예약 실행(GitHub Actions)이 부르는 주소. 비밀값 없이도 안전합니다: 정해진 시간에만, 한 사람당 하루 아침 1번·밤 1번만 보냅니다.
export async function onRequest({ env }){ return json(await runBatch(env)); }
