// 웹 푸시 발송 (RFC 8291 aes128gcm 암호화 + RFC 8292 VAPID 서명) — 외부 라이브러리 없이 WebCrypto만 사용
const enc = new TextEncoder();
export function b64u(buf){ const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf); let s=""; for(const x of b) s+=String.fromCharCode(x); return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); }
export function unb64u(s){ s=s.replace(/-/g,"+").replace(/_/g,"/"); while(s.length%4) s+="="; const bin=atob(s), out=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i); return out; }
function concat(...arrs){ const n=arrs.reduce((a,b)=>a+b.length,0), out=new Uint8Array(n); let o=0; for(const a of arrs){ out.set(a,o); o+=a.length; } return out; }
async function hkdf(salt, ikm, info, len){
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({name:"HKDF", hash:"SHA-256", salt, info}, key, len*8));
}
export async function encryptPayload(p256dh, auth, plaintext){
  const uaPub = unb64u(p256dh), authSecret = unb64u(auth);
  const as = await crypto.subtle.generateKey({name:"ECDH", namedCurve:"P-256"}, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", as.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPub, {name:"ECDH", namedCurve:"P-256"}, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({name:"ECDH", public:uaKey}, as.privateKey, 256));
  const ikm = await hkdf(authSecret, shared, concat(enc.encode("WebPush: info\0"), uaPub, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const body = concat(enc.encode(plaintext), new Uint8Array([2]));
  const ct = new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM", iv:nonce}, key, body));
  const header = new Uint8Array(21+asPub.length); header.set(salt,0); new DataView(header.buffer).setUint32(16,4096); header[20]=asPub.length; header.set(asPub,21);
  return concat(header, ct);
}
export async function vapidAuth(endpoint, jwk, subject){
  const aud = new URL(endpoint).origin, exp = Math.floor(Date.now()/1000) + 12*3600;
  const h = b64u(enc.encode(JSON.stringify({typ:"JWT", alg:"ES256"}))), c = b64u(enc.encode(JSON.stringify({aud, exp, sub:subject})));
  const key = await crypto.subtle.importKey("jwk", {kty:"EC", crv:"P-256", x:jwk.x, y:jwk.y, d:jwk.d, ext:true}, {name:"ECDSA", namedCurve:"P-256"}, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign({name:"ECDSA", hash:"SHA-256"}, key, enc.encode(h+"."+c)));
  const pub = concat(new Uint8Array([4]), unb64u(jwk.x), unb64u(jwk.y));
  return `vapid t=${h}.${c}.${b64u(sig)}, k=${b64u(pub)}`;
}
// 한 명에게 보내기. 반환: "ok" | "gone"(구독 만료 → 삭제) | "fail"
export async function sendPush(sub, message, jwk, subject, ttl=6*3600){
  const body = await encryptPayload(sub.p256dh, sub.auth, JSON.stringify(message));
  const r = await fetch(sub.endpoint, { method:"POST", body, headers:{
    "Content-Encoding":"aes128gcm", "Content-Type":"application/octet-stream", "TTL":String(ttl), "Urgency":"normal",
    "Authorization": await vapidAuth(sub.endpoint, jwk, subject) } });
  if(r.status===404 || r.status===410) return "gone";
  return r.ok ? "ok" : "fail";
}
