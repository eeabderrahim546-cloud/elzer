// ============================================================
// ELZER - Module de hachage de mot de passe (SHA-256 + sel)
// Utilise l'API native crypto.subtle du navigateur (aucune dependance).
// Format stocke : "elzerhash$v1$<hex>"
// Compatibilite : les anciens mots de passe en clair restent acceptes
// et sont convertis automatiquement au premier login reussi.
// ============================================================
(function(global){
  var PREFIX = 'elzerhash$v1$';
  var SALT = 'ELZER-2026-Marrakech-Distribution-Salt-v1';

  function bufToHex(buf){
    var bytes = new Uint8Array(buf);
    var hex = '';
    for(var i=0;i<bytes.length;i++){
      var h = bytes[i].toString(16);
      if(h.length===1) h='0'+h;
      hex += h;
    }
    return hex;
  }

  // Retourne une promesse resolue avec le hash au format "elzerhash$v1$<hex>"
  function hashPassword(plain){
    var text = SALT + '::' + String(plain);
    if(global.crypto && global.crypto.subtle && global.TextEncoder){
      var data = new TextEncoder().encode(text);
      return global.crypto.subtle.digest('SHA-256', data).then(function(buf){
        return PREFIX + bufToHex(buf);
      });
    }
    // Fallback (navigateur tres ancien / contexte non securise) : hash simple non-crypto
    // -> au moins on ne stocke pas le clair. Prefixe different pour le distinguer.
    return Promise.resolve('elzerhash$fb$' + simpleHash(text));
  }

  // Fallback deterministe (djb2) si crypto.subtle indisponible
  function simpleHash(str){
    var h = 5381;
    for(var i=0;i<str.length;i++){ h = ((h<<5)+h) + str.charCodeAt(i); h = h & 0xffffffff; }
    return (h>>>0).toString(16);
  }

  function isHashed(stored){
    return typeof stored==='string' && (stored.indexOf(PREFIX)===0 || stored.indexOf('elzerhash$fb$')===0);
  }

  // Verifie un mot de passe en clair contre une valeur stockee.
  // - Si la valeur stockee est deja hachee : compare les hashes.
  // - Si la valeur stockee est en clair (ancien format) : compare directement.
  // Retourne une promesse resolue avec { ok: bool, needsUpgrade: bool }
  //   needsUpgrade = true quand le match s'est fait sur du clair -> a re-stocker hache.
  function verifyPassword(plain, stored){
    if(isHashed(stored)){
      return hashPassword(plain).then(function(h){
        return { ok: (h===stored), needsUpgrade:false };
      });
    }
    // Ancien format en clair
    var ok = (String(plain) === String(stored));
    return Promise.resolve({ ok: ok, needsUpgrade: ok });
  }

  global.ElzerCrypto = {
    hashPassword: hashPassword,
    verifyPassword: verifyPassword,
    isHashed: isHashed,
    PREFIX: PREFIX
  };
})(window);
