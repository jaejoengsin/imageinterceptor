// Utility module for intercepting image src property, hiding image,
// generating SHA-256 based identifier and storing meta data.

export const imageDataArray = [];

/**
 * Convert ArrayBuffer to hex string.
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
export function bufferToHex(buffer) {
  const byteArray = new Uint8Array(buffer);
  return Array.from(byteArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate SHA-256 hash for a given string using SubtleCrypto.
 * It returns a promise resolving to a hexadecimal representation.
 * @param {string} text
 * @returns {Promise<string>}
 */
export function generateSHA256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  if (crypto && crypto.subtle && crypto.subtle.digest) {
    return crypto.subtle.digest('SHA-256', data).then(bufferToHex);
  }
  return Promise.reject(new Error('SubtleCrypto not supported'));
}

/**
 * Install a custom setter for HTMLImageElement.src. The setter hides the image,
 * generates a unique id from the url, adds the id as an attribute and stores
 * the meta data in a public array.
 */
export function installImageInterceptor() {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  if (!descriptor || !descriptor.set) return;
  const originalSetter = descriptor.set;
  const originalGetter = descriptor.get;

  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true,
    enumerable: descriptor.enumerable,
    get: function () {
      return originalGetter.call(this);
    },
    set: function (url) {
      // Hide the image using CSS.
      this.style.setProperty('visibility', 'hidden', 'important');

      // Generate SHA-256 based id and update attributes & store meta data.
      generateSHA256(url).then(hash => {
        this.setAttribute('img_id', hash);
        imageDataArray.push({ id: hash, url: url, harmful: false, sended: false });
      });

      // Call the original setter.
      originalSetter.call(this, url);
    }
  });
}
