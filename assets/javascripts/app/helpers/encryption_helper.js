define(function(require, exports, module) {

  var aesjs     = require('aes-js')

  var EncryptionHelper = {
    aesDecrypt: function(key_hex_str, encrypted_hex_str) {
      var key_str = key_hex_str
      var encrypted_str = encrypted_hex_str;
      // Convert Key String to Bytes
      var key_bytes = aesjs.utils.hex.toBytes(key_str)
      // Init AES plugin
      let aesCtr = new aesjs.ModeOfOperation.ctr(key_bytes, new aesjs.Counter(0));
      // Convert Encrypted Str to Bytes
      let encrypted_bytes  = aesjs.utils.hex.toBytes(encrypted_str);
      // Run AES Decryption (with Key Bytes & Encrypted Bytes)
      let decrypted_bytes = aesCtr.decrypt(encrypted_bytes);
      // Convert Decrypted Bytes to Str
      let decrypted_str       = aesjs.utils.utf8.fromBytes(decrypted_bytes);
      return decrypted_str;
    }
  }
  return EncryptionHelper;
})