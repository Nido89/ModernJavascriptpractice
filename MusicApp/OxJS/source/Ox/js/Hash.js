'use strict';

/*@
Ox.oshash <f> Calculates oshash for a given file or blob object. Async.
@*/
Ox.oshash = function(file, callback) {

    // Needs to go via string to work for files > 2GB
    var hash = fromString(file.size.toString());

    read(0);

    function add(A, B) {
        var a, b, c, d;
        d = A[3] + B[3];
        c = A[2] + B[2] + (d >> 16);
        d &= 0xffff;
        b = A[1] + B[1] + (c >> 16);
        c &= 0xffff;
        a = A[0] + B[0] + (b >> 16);
        b &= 0xffff;
        // Cut off overflow
        a &= 0xffff;
        return [a, b, c, d];
    }

    function fromData(s, offset) {
        offset = offset || 0;
        return [
            s.charCodeAt(offset + 6) + (s.charCodeAt(offset + 7) << 8),
            s.charCodeAt(offset + 4) + (s.charCodeAt(offset + 5) << 8),
            s.charCodeAt(offset + 2) + (s.charCodeAt(offset + 3) << 8),
            s.charCodeAt(offset + 0) + (s.charCodeAt(offset + 1) << 8)
        ];
    }

    function fromString(str) {
        var base = 10,
            blen = 1,
            i,
            num,
            pos,
            r = [0, 0, 0, 0];
        for (pos = 0; pos < str.length; pos++) {
            num = parseInt(str.charAt(pos), base);
            i = 0;
            do {
                while (i < blen) {
                    num += r[3 - i] * base;
                    r[3 - i++] = (num & 0xFFFF);
                    num >>>= 16;
                }
                if (num) {
                    blen++;
                }
            } while (num);
        }
        return r;
    }

    function hex(h) {
        return (
            Ox.pad(h[0].toString(16), 'left', 4, '0')
            + Ox.pad(h[1].toString(16), 'left', 4, '0')
            + Ox.pad(h[2].toString(16), 'left', 4, '0')
            + Ox.pad(h[3].toString(16), 'left', 4, '0')
        ).toLowerCase();
    }

    function read(offset, last) {
        var blob,
            block = 65536,
            length = 8,
            reader = new FileReader();
        reader.onload = function(data) {
            var s = data.target.result,
                s_length = s.length - length,
                i;
            for (i = 0; i <= s_length; i += length) {
                hash = add(hash, fromData(s, i));
            }
            if (file.size < block || last) {
                callback(hex(hash));
            } else {
                read(file.size - block, true);
            }
        };
        if (file.mozSlice) {
            blob = file.mozSlice(offset, offset + block);
        } else if (file.webkitSlice) {
            blob = file.webkitSlice(offset, offset + block);
        } else {
            blob = file.slice(offset, offset + block);
        }
        reader.readAsBinaryString(blob);
    }

};

/*@
Ox.SHA1 <f> Calculates SHA1 hash of the given string
@*/
Ox.SHA1 = function(msg) {

    function rotate_left(n,s) {
        var t4 = ( n<<s ) | (n>>>(32-s));
        return t4;
    };

    function cvt_hex(val) {
        var str="";
        var i;
        var v;
        for ( i=7; i>=0; i-- ) {
            v = (val>>>(i*4))&0x0f;
            str += v.toString(16);
        }
        return str;
    };

    var blockstart;
    var i, j;
    var W = new Array(80);
    var H0 = 0x67452301;
    var H1 = 0xEFCDAB89;
    var H2 = 0x98BADCFE;
    var H3 = 0x10325476;
    var H4 = 0xC3D2E1F0;
    var A, B, C, D, E;
    var temp;

    msg = Ox.encodeUTF8(msg);

    var msg_len = msg.length;

    var word_array = new Array();
    for ( i=0; i<msg_len-3; i+=4 ) {
        j = msg.charCodeAt(i)<<24 | msg.charCodeAt(i+1)<<16 |
        msg.charCodeAt(i+2)<<8 | msg.charCodeAt(i+3);
        word_array.push( j );
    }

    switch( msg_len % 4 ) {
        case 0:
            i = 0x080000000;
            break;
        case 1:
            i = msg.charCodeAt(msg_len-1)<<24 | 0x0800000;
            break;
        case 2:
            i = msg.charCodeAt(msg_len-2)<<24 | msg.charCodeAt(msg_len-1)<<16 | 0x08000;
            break;
        case 3:
            i = msg.charCodeAt(msg_len-3)<<24 | msg.charCodeAt(msg_len-2)<<16 | msg.charCodeAt(msg_len-1)<<8 | 0x80;
            break;
    }

    word_array.push( i );

    while( (word_array.length % 16) != 14 ) {
        word_array.push( 0 );
    }

    word_array.push( msg_len>>>29 );
    word_array.push( (msg_len<<3)&0x0ffffffff );


    for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {

        for ( i=0; i<16; i++ ) {
            W[i] = word_array[blockstart+i];
        }
        for ( i=16; i<=79; i++ ) {
            W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);
        }

        A = H0;
        B = H1;
        C = H2;
        D = H3;
        E = H4;

        for ( i= 0; i<=19; i++ ) {
            temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        for ( i=20; i<=39; i++ ) {
            temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        for ( i=40; i<=59; i++ ) {
            temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        for ( i=60; i<=79; i++ ) {
            temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        H0 = (H0 + A) & 0x0ffffffff;
        H1 = (H1 + B) & 0x0ffffffff;
        H2 = (H2 + C) & 0x0ffffffff;
        H3 = (H3 + D) & 0x0ffffffff;
        H4 = (H4 + E) & 0x0ffffffff;

    }
    var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
    return temp.toLowerCase();
}
