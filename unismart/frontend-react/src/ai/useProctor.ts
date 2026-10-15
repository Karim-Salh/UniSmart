import { useEffect, useRef } from "react";
import * as faceapi from "@vladmandic/face-api";
interface Opts { video: React.RefObject<HTMLVideoElement>; enabled: boolean; reference: Float32Array | null;
  absenceMs?: number; matchThreshold?: number; mismatchLimit?: number; onWarn: (m: string) => void; onTerminate: (reason: string) => void; onSignal?: (type: string) => void }
/** رصد الوجه: يُغلق الاختبار عند غياب الوجه 3 دقائق أو عدم مطابقته لصاحب الحساب (4 قراءات متتالية). كل المعالجة محلية ولا تُرسل صور. */
export function useProctor({ video, enabled, reference, absenceMs = 180_000, matchThreshold = 0.6, mismatchLimit = 4, onWarn, onTerminate, onSignal }: Opts) {
  const st = useRef({ absentSince: 0, mismatches: 0 });
  useEffect(() => {
    if (!enabled) return;
    let stop = false, timer: number;
    (async () => {
      await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri("/models"), faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models"), faceapi.nets.faceRecognitionNet.loadFromUri("/models")]);
      const tick = async () => {
        const v = video.current; if (stop || !v || v.readyState < 2) return;
        const now = Date.now();
        const ds = await faceapi.detectAllFaces(v, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })).withFaceLandmarks(true).withFaceDescriptors();
        if (!ds.length) {
          if (!st.current.absentSince) { st.current.absentSince = now; onSignal?.("FACE_ABSENT_START") }
          const gone = now - st.current.absentSince;
          if (gone >= absenceMs) return onTerminate("غياب الوجه عن الكاميرا لمدة 3 دقائق");
          if (gone >= 30_000) onWarn(`لم يُرصد وجهك منذ ${Math.round(gone / 1000)} ثانية`);
        } else {
          if (st.current.absentSince) { st.current.absentSince = 0; onSignal?.("FACE_RETURNED") }
          if (reference) {
            const d = Math.min(...ds.map(x => faceapi.euclideanDistance(x.descriptor, reference)));
            st.current.mismatches = d > matchThreshold ? st.current.mismatches + 1 : 0;
            if (d > matchThreshold) onSignal?.(`IDENTITY_MISMATCH:${d.toFixed(2)}`);
            if (st.current.mismatches >= mismatchLimit) return onTerminate("عدم تطابق الوجه مع صاحب الحساب");
          }
        }
      };
      timer = window.setInterval(() => tick().catch(() => {}), 3000);
    })();
    return () => { stop = true; clearInterval(timer) };
  }, [enabled, reference, video, absenceMs, matchThreshold, mismatchLimit, onWarn, onTerminate, onSignal]);
}
