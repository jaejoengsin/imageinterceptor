
const encoder   = new TextEncoder();


/**
 * Convert ArrayBuffer to hex string.
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function bufferToHex(buffer) {
  const byteArray = new Uint8Array(buffer); // 버퍼를 0-255 범위의 바이트 배열처럼 인덱스로 순회 1바이트 -> 8비트 -> unsigndeint = 0~255
  return Array.from(byteArray) //Uint8Array를 일반 JS 배열로 복사. ([byte0, byte1, …])
    .map(b => b.toString(16).padStart(2, '0')) //각 바이트 b를 b.toString(16) → 16진수 문자열(예 13 → "d"), padStart(2,'0') → 두 자리로 앞쪽 0 채움("0d").
    .join('');//두 자리씩 나온 16진수 토큰들을 공백 없이 연결
}



/**
 * Generate SHA-256 hash for a given string using SubtleCrypto.
 * It returns a promise resolving to a hexadecimal representation.
 * @param {string} text
 * @returns {Promise<string>}
 */
function generateSHA256(text) {
  const data = encoder.encode(text);
  if (crypto && crypto.subtle && crypto.subtle.digest) {
    return crypto.subtle.digest('SHA-256', data).then(bufferToHex);
  }
  return Promise.reject(new Error('SubtleCrypto not supported'));
}
