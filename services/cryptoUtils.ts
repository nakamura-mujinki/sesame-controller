// This utility provides AES-CMAC signing capabilities required by Sesame API.
// Since standard CryptoJS doesn't expose CMAC directly in the core bundle, 
// we implement the logic using AES primitives.

declare global {
  interface Window {
    CryptoJS: any;
  }
}

const CryptoJS = window.CryptoJS;

function bitShiftLeft(input: any) {
  const words = input.words;
  const sigBytes = input.sigBytes;
  const newWords = [];
  let carry = 0;

  for (let i = (sigBytes / 4) - 1; i >= 0; i--) {
    const val = words[i];
    newWords[i] = (val << 1) | carry;
    carry = (val >>> 31);
  }
  return CryptoJS.lib.WordArray.create(newWords, sigBytes);
}

function xor(a: any, b: any) {
  const aWords = a.words;
  const bWords = b.words;
  const newWords = [];
  for (let i = 0; i < a.sigBytes / 4; i++) {
    newWords[i] = aWords[i] ^ bWords[i];
  }
  return CryptoJS.lib.WordArray.create(newWords, a.sigBytes);
}

// Generate Subkeys for CMAC
function generateSubkeys(key: any) {
  const L = CryptoJS.AES.encrypt(
    CryptoJS.lib.WordArray.create(new Array(4).fill(0), 16),
    key,
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding }
  ).ciphertext;

  const Rb = CryptoJS.lib.WordArray.create([0x00000000, 0x00000000, 0x00000000, 0x00000087], 16);
  
  let K1 = bitShiftLeft(L);
  if (L.words[0] < 0) { // MSB is 1
    K1 = xor(K1, Rb);
  }

  let K2 = bitShiftLeft(K1);
  if (K1.words[0] < 0) {
    K2 = xor(K2, Rb);
  }

  return { K1, K2 };
}

// Main AES-CMAC function
export const generateCmac = (secretHex: string, messageHex: string): string => {
  const key = CryptoJS.enc.Hex.parse(secretHex);
  const message = CryptoJS.enc.Hex.parse(messageHex);
  
  const blockSize = 128 / 8; // 16 bytes
  const { K1, K2 } = generateSubkeys(key);

  const n = Math.ceil(message.sigBytes / blockSize);
  let lastBlock;
  let flag = false;

  // If message is empty or not a multiple of block size
  if (n === 0 || message.sigBytes % blockSize !== 0) {
    const paddingBytes = blockSize - (message.sigBytes % blockSize);
    // Padding: 100...0
    const paddingArr = [0x80]; 
    for(let i=1; i<paddingBytes; i++) paddingArr.push(0x00);
    
    // Convert padding to WordArray and concat
    const padding = CryptoJS.lib.WordArray.create(new Uint8Array(paddingArr));
    
    // If message is empty, just use padding, else concat
    const paddedMsg = message.concat(padding);
    
    // Get last block of padded message
    // Note: CryptoJS concat modifies in place, so 'message' is now padded
    const totalWords = paddedMsg.words.length;
    const lastWords = paddedMsg.words.slice(totalWords - 4, totalWords);
    lastBlock = CryptoJS.lib.WordArray.create(lastWords, 16);
    lastBlock = xor(lastBlock, K2);
    flag = true;
  } else {
    // Message is multiple of blocksize
    const totalWords = message.words.length;
    const lastWords = message.words.slice(totalWords - 4, totalWords);
    lastBlock = CryptoJS.lib.WordArray.create(lastWords, 16);
    lastBlock = xor(lastBlock, K1);
  }

  let X = CryptoJS.lib.WordArray.create([0,0,0,0], 16);
  let Y;

  // CBC Process for blocks 1 to n-1
  const loopLimit = flag ? n : n - 1; // if padded (flag=true), we loop all previous blocks then handle last manually. If not padded, loop n-1.
  
  // Actually, standard logic:
  // Split message into blocks M1...Mn
  // Mn is the one we XORed with K1 or K2 above.
  // We process M1...Mn-1 normally with CBC.
  // Then process modified Mn.

  // Re-getting message words because concat might have messed references if not careful
  const fullMessage = message; // It is already padded or original

  for (let i = 0; i < (flag ? n - 1 : n - 1); i++) {
     const blockWords = fullMessage.words.slice(i * 4, (i + 1) * 4);
     const Mi = CryptoJS.lib.WordArray.create(blockWords, 16);
     Y = xor(X, Mi);
     X = CryptoJS.AES.encrypt(Y, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding }).ciphertext;
  }

  // Final step
  Y = xor(X, lastBlock);
  const T = CryptoJS.AES.encrypt(Y, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding }).ciphertext;

  return T.toString(CryptoJS.enc.Hex);
};
