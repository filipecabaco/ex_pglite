#!/usr/bin/env bun
// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, {
      get: all[name2],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name2] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);

// node_modules/@electric-sql/pglite/dist/chunk-BTBUZ646.js
var p, i2, c, f, l, s, a = (t) => {
  throw TypeError(t);
}, _ = (t, e, o) => (e in t) ? i2(t, e, { enumerable: true, configurable: true, writable: true, value: o }) : t[e] = o, d = (t, e) => () => (t && (e = t(t = 0)), e), D = (t, e) => () => (e || t((e = { exports: {} }).exports, e), e.exports), F = (t, e) => {
  for (var o in e)
    i2(t, o, { get: e[o], enumerable: true });
}, g = (t, e, o, m) => {
  if (e && typeof e == "object" || typeof e == "function")
    for (let r of f(e))
      !s.call(t, r) && r !== o && i2(t, r, { get: () => e[r], enumerable: !(m = c(e, r)) || m.enumerable });
  return t;
}, L = (t, e, o) => (o = t != null ? p(l(t)) : {}, g(e || !t || !t.__esModule ? i2(o, "default", { value: t, enumerable: true }) : o, t)), P = (t, e, o) => _(t, typeof e != "symbol" ? e + "" : e, o), n = (t, e, o) => e.has(t) || a("Cannot " + o), h = (t, e, o) => (n(t, e, "read from private field"), o ? o.call(t) : e.get(t)), R = (t, e, o) => e.has(t) ? a("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, o), x = (t, e, o, m) => (n(t, e, "write to private field"), m ? m.call(t, o) : e.set(t, o), o), T = (t, e, o) => (n(t, e, "access private method"), o), U = (t, e, o, m) => ({ set _(r) {
  x(t, e, r, o);
}, get _() {
  return h(t, e, m);
} }), u;
var init_chunk_BTBUZ646 = __esm(() => {
  p = Object.create;
  i2 = Object.defineProperty;
  c = Object.getOwnPropertyDescriptor;
  f = Object.getOwnPropertyNames;
  l = Object.getPrototypeOf;
  s = Object.prototype.hasOwnProperty;
  u = d(() => {
  });
});

// node_modules/@electric-sql/pglite/dist/chunk-VV2EXAN2.js
async function H2(r, e, t2 = "pgdata", s3 = "auto") {
  let a2 = Br(r, e), [n2, o3] = await qr(a2, s3), i3 = t2 + (o3 ? ".tar.gz" : ".tar"), u2 = o3 ? "application/x-gzip" : "application/x-tar";
  return typeof File < "u" ? new File([n2], i3, { type: u2 }) : new Blob([n2], { type: u2 });
}
async function ce2(r, e, t2) {
  let s3 = new Uint8Array(await e.arrayBuffer()), a2 = typeof File < "u" && e instanceof File ? e.name : undefined;
  (Hr.includes(e.type) || a2?.endsWith(".tgz") || a2?.endsWith(".tar.gz")) && (s3 = await ar(s3));
  let o3;
  try {
    o3 = (0, g4.untar)(s3);
  } catch (i3) {
    if (i3 instanceof Error && i3.message.includes("File is corrupted"))
      s3 = await ar(s3), o3 = (0, g4.untar)(s3);
    else
      throw i3;
  }
  for (let i3 of o3) {
    let u2 = t2 + i3.name, c2 = u2.split("/").slice(0, -1);
    for (let m3 = 1;m3 <= c2.length; m3++) {
      let y3 = c2.slice(0, m3).join("/");
      r.analyzePath(y3).exists || r.mkdir(y3);
    }
    i3.type === g4.REGTYPE ? (r.writeFile(u2, i3.data), r.utime(u2, sr(i3.modifyTime), sr(i3.modifyTime))) : i3.type === g4.DIRTYPE && r.mkdir(u2);
  }
}
function jr(r, e) {
  let t2 = [], s3 = (a2) => {
    r.readdir(a2).forEach((o3) => {
      if (o3 === "." || o3 === "..")
        return;
      let i3 = a2 + "/" + o3, u2 = r.stat(i3), c2 = r.isFile(u2.mode) ? r.readFile(i3, { encoding: "binary" }) : new Uint8Array(0);
      t2.push({ name: i3.substring(e.length), mode: u2.mode, size: u2.size, type: r.isFile(u2.mode) ? g4.REGTYPE : g4.DIRTYPE, modifyTime: u2.mtime, data: c2 }), r.isDir(u2.mode) && s3(i3);
    });
  };
  return s3(e), t2;
}
function Br(r, e) {
  let t2 = jr(r, e);
  return (0, g4.tar)(t2);
}
async function qr(r, e = "auto") {
  if (e === "none")
    return [r, false];
  if (typeof CompressionStream < "u")
    return [await Yr(r), true];
  if (typeof process < "u" && process.versions && process.versions.node)
    return [await Wr(r), true];
  if (e === "auto")
    return [r, false];
  throw new Error("Compression not supported in this environment");
}
async function Yr(r) {
  let e = new CompressionStream("gzip"), t2 = e.writable.getWriter(), s3 = e.readable.getReader();
  t2.write(r), t2.close();
  let a2 = [];
  for (;; ) {
    let { value: i3, done: u2 } = await s3.read();
    if (u2)
      break;
    i3 && a2.push(i3);
  }
  let n2 = new Uint8Array(a2.reduce((i3, u2) => i3 + u2.length, 0)), o3 = 0;
  return a2.forEach((i3) => {
    n2.set(i3, o3), o3 += i3.length;
  }), n2;
}
async function Wr(r) {
  let { promisify: e } = await import("util"), { gzip: t2 } = await import("zlib");
  return await e(t2)(r);
}
async function ar(r) {
  if (typeof CompressionStream < "u")
    return await Xr(r);
  if (typeof process < "u" && process.versions && process.versions.node)
    return await Kr(r);
  throw new Error("Unsupported environment for decompression");
}
async function Xr(r) {
  let e = new DecompressionStream("gzip"), t2 = e.writable.getWriter(), s3 = e.readable.getReader();
  t2.write(r), t2.close();
  let a2 = [];
  for (;; ) {
    let { value: i3, done: u2 } = await s3.read();
    if (u2)
      break;
    i3 && a2.push(i3);
  }
  let n2 = new Uint8Array(a2.reduce((i3, u2) => i3 + u2.length, 0)), o3 = 0;
  return a2.forEach((i3) => {
    n2.set(i3, o3), o3 += i3.length;
  }), n2;
}
async function Kr(r) {
  let { promisify: e } = await import("util"), { gunzip: t2 } = await import("zlib");
  return await e(t2)(r);
}
function sr(r) {
  return r ? typeof r == "number" ? r : Math.floor(r.getTime() / 1000) : Math.floor(Date.now() / 1000);
}
var w2, x4, L3, er, nr, or, g4, Hr, Vr = "/tmp/pglite", C2, ur = class {
  constructor(e) {
    this.dataDir = e;
  }
  async init(e, t2) {
    return this.pg = e, { emscriptenOpts: t2 };
  }
  async syncToFs(e) {
  }
  async initialSyncFs() {
  }
  async closeFs() {
  }
  async dumpTar(e, t2) {
    return H2(this.pg.Module.FS, C2, e, t2);
  }
}, cr = class {
  constructor(e, { debug: t2 = false } = {}) {
    this.dataDir = e, this.debug = t2;
  }
  async syncToFs(e) {
  }
  async initialSyncFs() {
  }
  async closeFs() {
  }
  async dumpTar(e, t2) {
    return H2(this.pg.Module.FS, C2, e, t2);
  }
  async init(e, t2) {
    return this.pg = e, { emscriptenOpts: { ...t2, preRun: [...t2.preRun || [], (a2) => {
      let n2 = Zr(a2, this);
      a2.FS.mkdir(C2), a2.FS.mount(n2, {}, C2);
    }] } };
  }
}, pr, Zr = (r, e) => {
  let t2 = r.FS, s3 = e.debug ? console.log : null, a2 = { tryFSOperation(n2) {
    try {
      return n2();
    } catch (o3) {
      throw o3.code ? o3.code === "UNKNOWN" ? new t2.ErrnoError(pr.EINVAL) : new t2.ErrnoError(o3.code) : o3;
    }
  }, mount(n2) {
    return a2.createNode(null, "/", 16895, 0);
  }, syncfs(n2, o3, i3) {
  }, createNode(n2, o3, i3, u2) {
    if (!t2.isDir(i3) && !t2.isFile(i3))
      throw new t2.ErrnoError(28);
    let c2 = t2.createNode(n2, o3, i3);
    return c2.node_ops = a2.node_ops, c2.stream_ops = a2.stream_ops, c2;
  }, getMode: function(n2) {
    return s3?.("getMode", n2), a2.tryFSOperation(() => e.lstat(n2).mode);
  }, realPath: function(n2) {
    let o3 = [];
    for (;n2.parent !== n2; )
      o3.push(n2.name), n2 = n2.parent;
    return o3.push(n2.mount.opts.root), o3.reverse(), o3.join("/");
  }, node_ops: { getattr(n2) {
    s3?.("getattr", a2.realPath(n2));
    let o3 = a2.realPath(n2);
    return a2.tryFSOperation(() => {
      let i3 = e.lstat(o3);
      return { ...i3, dev: 0, ino: n2.id, nlink: 1, rdev: n2.rdev, atime: new Date(i3.atime), mtime: new Date(i3.mtime), ctime: new Date(i3.ctime) };
    });
  }, setattr(n2, o3) {
    s3?.("setattr", a2.realPath(n2), o3);
    let i3 = a2.realPath(n2);
    a2.tryFSOperation(() => {
      o3.mode !== undefined && e.chmod(i3, o3.mode), o3.size !== undefined && e.truncate(i3, o3.size), o3.timestamp !== undefined && e.utimes(i3, o3.timestamp, o3.timestamp), o3.size !== undefined && e.truncate(i3, o3.size);
    });
  }, lookup(n2, o3) {
    s3?.("lookup", a2.realPath(n2), o3);
    let i3 = [a2.realPath(n2), o3].join("/"), u2 = a2.getMode(i3);
    return a2.createNode(n2, o3, u2);
  }, mknod(n2, o3, i3, u2) {
    s3?.("mknod", a2.realPath(n2), o3, i3, u2);
    let c2 = a2.createNode(n2, o3, i3, u2), m3 = a2.realPath(c2);
    return a2.tryFSOperation(() => (t2.isDir(c2.mode) ? e.mkdir(m3, { mode: i3 }) : e.writeFile(m3, "", { mode: i3 }), c2));
  }, rename(n2, o3, i3) {
    s3?.("rename", a2.realPath(n2), a2.realPath(o3), i3);
    let u2 = a2.realPath(n2), c2 = [a2.realPath(o3), i3].join("/");
    a2.tryFSOperation(() => {
      e.rename(u2, c2);
    }), n2.name = i3;
  }, unlink(n2, o3) {
    s3?.("unlink", a2.realPath(n2), o3);
    let i3 = [a2.realPath(n2), o3].join("/");
    try {
      e.unlink(i3);
    } catch {
    }
  }, rmdir(n2, o3) {
    s3?.("rmdir", a2.realPath(n2), o3);
    let i3 = [a2.realPath(n2), o3].join("/");
    return a2.tryFSOperation(() => {
      e.rmdir(i3);
    });
  }, readdir(n2) {
    s3?.("readdir", a2.realPath(n2));
    let o3 = a2.realPath(n2);
    return a2.tryFSOperation(() => e.readdir(o3));
  }, symlink(n2, o3, i3) {
    throw s3?.("symlink", a2.realPath(n2), o3, i3), new t2.ErrnoError(63);
  }, readlink(n2) {
    throw s3?.("readlink", a2.realPath(n2)), new t2.ErrnoError(63);
  } }, stream_ops: { open(n2) {
    s3?.("open stream", a2.realPath(n2.node));
    let o3 = a2.realPath(n2.node);
    return a2.tryFSOperation(() => {
      t2.isFile(n2.node.mode) && (n2.shared.refcount = 1, n2.nfd = e.open(o3));
    });
  }, close(n2) {
    return s3?.("close stream", a2.realPath(n2.node)), a2.tryFSOperation(() => {
      t2.isFile(n2.node.mode) && n2.nfd && --n2.shared.refcount === 0 && e.close(n2.nfd);
    });
  }, dup(n2) {
    s3?.("dup stream", a2.realPath(n2.node)), n2.shared.refcount++;
  }, read(n2, o3, i3, u2, c2) {
    return s3?.("read stream", a2.realPath(n2.node), i3, u2, c2), u2 === 0 ? 0 : a2.tryFSOperation(() => e.read(n2.nfd, o3, i3, u2, c2));
  }, write(n2, o3, i3, u2, c2) {
    return s3?.("write stream", a2.realPath(n2.node), i3, u2, c2), a2.tryFSOperation(() => e.write(n2.nfd, o3.buffer, i3, u2, c2));
  }, llseek(n2, o3, i3) {
    s3?.("llseek stream", a2.realPath(n2.node), o3, i3);
    let u2 = o3;
    if (i3 === 1 ? u2 += n2.position : i3 === 2 && t2.isFile(n2.node.mode) && a2.tryFSOperation(() => {
      let c2 = e.fstat(n2.nfd);
      u2 += c2.size;
    }), u2 < 0)
      throw new t2.ErrnoError(28);
    return u2;
  }, mmap(n2, o3, i3, u2, c2) {
    if (s3?.("mmap stream", a2.realPath(n2.node), o3, i3, u2, c2), !t2.isFile(n2.node.mode))
      throw new t2.ErrnoError(pr.ENODEV);
    let m3 = r.mmapAlloc(o3);
    return a2.stream_ops.read(n2, r.HEAP8, m3, o3, i3), { ptr: m3, allocated: true };
  }, msync(n2, o3, i3, u2, c2) {
    return s3?.("msync stream", a2.realPath(n2.node), i3, u2, c2), a2.stream_ops.write(n2, o3, 0, u2, i3), 0;
  } } };
  return a2;
};
var init_chunk_VV2EXAN2 = __esm(() => {
  init_chunk_BTBUZ646();
  w2 = D(($r, l3) => {
    u();
    var j2 = 9007199254740991, B = function(r) {
      return r;
    }();
    function mr(r) {
      return r === B;
    }
    function q2(r) {
      return typeof r == "string" || Object.prototype.toString.call(r) == "[object String]";
    }
    function lr(r) {
      return Object.prototype.toString.call(r) == "[object Date]";
    }
    function N2(r) {
      return r !== null && typeof r == "object";
    }
    function U3(r) {
      return typeof r == "function";
    }
    function fr(r) {
      return typeof r == "number" && r > -1 && r % 1 == 0 && r <= j2;
    }
    function yr(r) {
      return Object.prototype.toString.call(r) == "[object Array]";
    }
    function Y2(r) {
      return N2(r) && !U3(r) && fr(r.length);
    }
    function D3(r) {
      return Object.prototype.toString.call(r) == "[object ArrayBuffer]";
    }
    function gr(r, e) {
      return Array.prototype.map.call(r, e);
    }
    function hr(r, e) {
      var t2 = B;
      return U3(e) && Array.prototype.every.call(r, function(s3, a2, n2) {
        var o3 = e(s3, a2, n2);
        return o3 && (t2 = s3), !o3;
      }), t2;
    }
    function Sr(r) {
      return Object.assign.apply(null, arguments);
    }
    function W2(r) {
      var e, t2, s3;
      if (q2(r)) {
        for (t2 = r.length, s3 = new Uint8Array(t2), e = 0;e < t2; e++)
          s3[e] = r.charCodeAt(e) & 255;
        return s3;
      }
      return D3(r) ? new Uint8Array(r) : N2(r) && D3(r.buffer) ? new Uint8Array(r.buffer) : Y2(r) ? new Uint8Array(r) : N2(r) && U3(r.toString) ? W2(r.toString()) : new Uint8Array;
    }
    l3.exports.MAX_SAFE_INTEGER = j2;
    l3.exports.isUndefined = mr;
    l3.exports.isString = q2;
    l3.exports.isObject = N2;
    l3.exports.isDateTime = lr;
    l3.exports.isFunction = U3;
    l3.exports.isArray = yr;
    l3.exports.isArrayLike = Y2;
    l3.exports.isArrayBuffer = D3;
    l3.exports.map = gr;
    l3.exports.find = hr;
    l3.exports.extend = Sr;
    l3.exports.toUint8Array = W2;
  });
  x4 = D((Qr, X2) => {
    u();
    var M2 = "\0";
    X2.exports = { NULL_CHAR: M2, TMAGIC: "ustar" + M2 + "00", OLDGNU_MAGIC: "ustar  " + M2, REGTYPE: 0, LNKTYPE: 1, SYMTYPE: 2, CHRTYPE: 3, BLKTYPE: 4, DIRTYPE: 5, FIFOTYPE: 6, CONTTYPE: 7, TSUID: parseInt("4000", 8), TSGID: parseInt("2000", 8), TSVTX: parseInt("1000", 8), TUREAD: parseInt("0400", 8), TUWRITE: parseInt("0200", 8), TUEXEC: parseInt("0100", 8), TGREAD: parseInt("0040", 8), TGWRITE: parseInt("0020", 8), TGEXEC: parseInt("0010", 8), TOREAD: parseInt("0004", 8), TOWRITE: parseInt("0002", 8), TOEXEC: parseInt("0001", 8), TPERMALL: parseInt("0777", 8), TPERMMASK: parseInt("0777", 8) };
  });
  L3 = D((ee2, f2) => {
    u();
    var K2 = w2(), p3 = x4(), Fr = 512, I = p3.TPERMALL, V2 = 0, Z2 = 0, _3 = [["name", 100, 0, function(r, e) {
      return v2(r[e[0]], e[1]);
    }, function(r, e, t2) {
      return A2(r.slice(e, e + t2[1]));
    }], ["mode", 8, 100, function(r, e) {
      var t2 = r[e[0]] || I;
      return t2 = t2 & p3.TPERMMASK, P3(t2, e[1], I);
    }, function(r, e, t2) {
      var s3 = S2(r.slice(e, e + t2[1]));
      return s3 &= p3.TPERMMASK, s3;
    }], ["uid", 8, 108, function(r, e) {
      return P3(r[e[0]], e[1], V2);
    }, function(r, e, t2) {
      return S2(r.slice(e, e + t2[1]));
    }], ["gid", 8, 116, function(r, e) {
      return P3(r[e[0]], e[1], Z2);
    }, function(r, e, t2) {
      return S2(r.slice(e, e + t2[1]));
    }], ["size", 12, 124, function(r, e) {
      return P3(r.data.length, e[1]);
    }, function(r, e, t2) {
      return S2(r.slice(e, e + t2[1]));
    }], ["modifyTime", 12, 136, function(r, e) {
      return k(r[e[0]], e[1]);
    }, function(r, e, t2) {
      return z2(r.slice(e, e + t2[1]));
    }], ["checksum", 8, 148, function(r, e) {
      return "        ";
    }, function(r, e, t2) {
      return S2(r.slice(e, e + t2[1]));
    }], ["type", 1, 156, function(r, e) {
      return "" + (parseInt(r[e[0]], 10) || 0) % 8;
    }, function(r, e, t2) {
      return (parseInt(String.fromCharCode(r[e]), 10) || 0) % 8;
    }], ["linkName", 100, 157, function(r, e) {
      return "";
    }, function(r, e, t2) {
      return A2(r.slice(e, e + t2[1]));
    }], ["ustar", 8, 257, function(r, e) {
      return p3.TMAGIC;
    }, function(r, e, t2) {
      return br(A2(r.slice(e, e + t2[1]), true));
    }, function(r, e) {
      return r[e[0]] == p3.TMAGIC || r[e[0]] == p3.OLDGNU_MAGIC;
    }], ["owner", 32, 265, function(r, e) {
      return v2(r[e[0]], e[1]);
    }, function(r, e, t2) {
      return A2(r.slice(e, e + t2[1]));
    }], ["group", 32, 297, function(r, e) {
      return v2(r[e[0]], e[1]);
    }, function(r, e, t2) {
      return A2(r.slice(e, e + t2[1]));
    }], ["majorNumber", 8, 329, function(r, e) {
      return "";
    }, function(r, e, t2) {
      return S2(r.slice(e, e + t2[1]));
    }], ["minorNumber", 8, 337, function(r, e) {
      return "";
    }, function(r, e, t2) {
      return S2(r.slice(e, e + t2[1]));
    }], ["prefix", 131, 345, function(r, e) {
      return v2(r[e[0]], e[1]);
    }, function(r, e, t2) {
      return A2(r.slice(e, e + t2[1]));
    }], ["accessTime", 12, 476, function(r, e) {
      return k(r[e[0]], e[1]);
    }, function(r, e, t2) {
      return z2(r.slice(e, e + t2[1]));
    }], ["createTime", 12, 488, function(r, e) {
      return k(r[e[0]], e[1]);
    }, function(r, e, t2) {
      return z2(r.slice(e, e + t2[1]));
    }]], $2 = function(r) {
      var e = r[r.length - 1];
      return e[2] + e[1];
    }(_3);
    function br(r) {
      if (r.length == 8) {
        var e = r.split("");
        if (e[5] == p3.NULL_CHAR)
          return (e[6] == " " || e[6] == p3.NULL_CHAR) && (e[6] = "0"), (e[7] == " " || e[7] == p3.NULL_CHAR) && (e[7] = "0"), e = e.join(""), e == p3.TMAGIC ? e : r;
        if (e[7] == p3.NULL_CHAR)
          return e[5] == p3.NULL_CHAR && (e[5] = " "), e[6] == p3.NULL_CHAR && (e[6] = " "), e == p3.OLDGNU_MAGIC ? e : r;
      }
      return r;
    }
    function v2(r, e) {
      return e -= 1, K2.isUndefined(r) && (r = ""), r = ("" + r).substr(0, e), r + p3.NULL_CHAR;
    }
    function P3(r, e, t2) {
      for (t2 = parseInt(t2) || 0, e -= 1, r = (parseInt(r) || t2).toString(8).substr(-e, e);r.length < e; )
        r = "0" + r;
      return r + p3.NULL_CHAR;
    }
    function k(r, e) {
      if (K2.isDateTime(r))
        r = Math.floor(1 * r / 1000);
      else if (r = parseInt(r, 10), isFinite(r)) {
        if (r <= 0)
          return "";
      } else
        r = Math.floor(1 * new Date / 1000);
      return P3(r, e, 0);
    }
    function A2(r, e) {
      var t2 = String.fromCharCode.apply(null, r);
      if (e)
        return t2;
      var s3 = t2.indexOf(p3.NULL_CHAR);
      return s3 >= 0 ? t2.substr(0, s3) : t2;
    }
    function S2(r) {
      var e = String.fromCharCode.apply(null, r);
      return parseInt(e.replace(/^0+$/g, ""), 8) || 0;
    }
    function z2(r) {
      return r.length == 0 || r[0] == 0 ? null : new Date(1000 * S2(r));
    }
    function Tr2(r, e, t2) {
      var s3 = parseInt(e, 10) || 0, a2 = Math.min(s3 + $2, r.length), n2 = 0, o3 = 0, i3 = 0;
      t2 && _3.every(function(y3) {
        return y3[0] == "checksum" ? (o3 = s3 + y3[2], i3 = o3 + y3[1], false) : true;
      });
      for (var u2 = 32, c2 = s3;c2 < a2; c2++) {
        var m3 = c2 >= o3 && c2 < i3 ? u2 : r[c2];
        n2 = (n2 + m3) % 262144;
      }
      return n2;
    }
    f2.exports.recordSize = Fr;
    f2.exports.defaultFileMode = I;
    f2.exports.defaultUid = V2;
    f2.exports.defaultGid = Z2;
    f2.exports.posixHeader = _3;
    f2.exports.effectiveHeaderSize = $2;
    f2.exports.calculateChecksum = Tr2;
    f2.exports.formatTarString = v2;
    f2.exports.formatTarNumber = P3;
    f2.exports.formatTarDateTime = k;
    f2.exports.parseTarString = A2;
    f2.exports.parseTarNumber = S2;
    f2.exports.parseTarDateTime = z2;
  });
  er = D((ne2, rr) => {
    u();
    var Ar = x4(), O3 = w2(), F4 = L3();
    function J2(r) {
      return F4.recordSize;
    }
    function Q2(r) {
      return Math.ceil(r.data.length / F4.recordSize) * F4.recordSize;
    }
    function Er2(r) {
      var e = 0;
      return r.forEach(function(t2) {
        e += J2(t2) + Q2(t2);
      }), e += F4.recordSize * 2, new Uint8Array(e);
    }
    function Pr(r, e, t2) {
      t2 = parseInt(t2) || 0;
      var s3 = t2;
      F4.posixHeader.forEach(function(u2) {
        for (var c2 = u2[3](e, u2), m3 = c2.length, y3 = 0;y3 < m3; y3 += 1)
          r[s3 + y3] = c2.charCodeAt(y3) & 255;
        s3 += u2[1];
      });
      var a2 = O3.find(F4.posixHeader, function(u2) {
        return u2[0] == "checksum";
      });
      if (a2) {
        var n2 = F4.calculateChecksum(r, t2, true), o3 = F4.formatTarNumber(n2, a2[1] - 2) + Ar.NULL_CHAR + " ";
        s3 = t2 + a2[2];
        for (var i3 = 0;i3 < o3.length; i3 += 1)
          r[s3] = o3.charCodeAt(i3) & 255, s3++;
      }
      return t2 + J2(e);
    }
    function wr(r, e, t2) {
      return t2 = parseInt(t2, 10) || 0, r.set(e.data, t2), t2 + Q2(e);
    }
    function xr(r) {
      r = O3.map(r, function(s3) {
        return O3.extend({}, s3, { data: O3.toUint8Array(s3.data) });
      });
      var e = Er2(r), t2 = 0;
      return r.forEach(function(s3) {
        t2 = Pr(e, s3, t2), t2 = wr(e, s3, t2);
      }), e;
    }
    rr.exports.tar = xr;
  });
  nr = D((oe, tr) => {
    u();
    var vr = x4(), G2 = w2(), h2 = L3(), Nr2 = { extractData: true, checkHeader: true, checkChecksum: true, checkFileSize: true }, Ur = { size: true, checksum: true, ustar: true }, R3 = { unexpectedEndOfFile: "Unexpected end of file.", fileCorrupted: "File is corrupted.", checksumCheckFailed: "Checksum check failed." };
    function kr(r) {
      return h2.recordSize;
    }
    function zr(r) {
      return Math.ceil(r / h2.recordSize) * h2.recordSize;
    }
    function Or(r, e) {
      for (var t2 = e, s3 = Math.min(r.length, e + h2.recordSize * 2), a2 = t2;a2 < s3; a2++)
        if (r[a2] != 0)
          return false;
      return true;
    }
    function Cr(r, e, t2) {
      if (r.length - e < h2.recordSize) {
        if (t2.checkFileSize)
          throw new Error(R3.unexpectedEndOfFile);
        return null;
      }
      e = parseInt(e) || 0;
      var s3 = {}, a2 = e;
      if (h2.posixHeader.forEach(function(i3) {
        s3[i3[0]] = i3[4](r, a2, i3), a2 += i3[1];
      }), s3.type != 0 && (s3.size = 0), t2.checkHeader && h2.posixHeader.forEach(function(i3) {
        if (G2.isFunction(i3[5]) && !i3[5](s3, i3)) {
          var u2 = new Error(R3.fileCorrupted);
          throw u2.data = { offset: e + i3[2], field: i3[0] }, u2;
        }
      }), t2.checkChecksum) {
        var n2 = h2.calculateChecksum(r, e, true);
        if (n2 != s3.checksum) {
          var o3 = new Error(R3.checksumCheckFailed);
          throw o3.data = { offset: e, header: s3, checksum: n2 }, o3;
        }
      }
      return s3;
    }
    function Dr(r, e, t2, s3) {
      return s3.extractData ? t2.size <= 0 ? new Uint8Array : r.slice(e, e + t2.size) : null;
    }
    function Mr(r, e) {
      var t2 = {};
      return h2.posixHeader.forEach(function(s3) {
        var a2 = s3[0];
        Ur[a2] || (t2[a2] = r[a2]);
      }), t2.isOldGNUFormat = r.ustar == vr.OLDGNU_MAGIC, e && (t2.data = e), t2;
    }
    function Ir(r, e) {
      e = G2.extend({}, Nr2, e);
      for (var t2 = [], s3 = 0, a2 = r.length;a2 - s3 >= h2.recordSize; ) {
        r = G2.toUint8Array(r);
        var n2 = Cr(r, s3, e);
        if (!n2)
          break;
        s3 += kr(n2);
        var o3 = Dr(r, s3, n2, e);
        if (t2.push(Mr(n2, o3)), s3 += zr(n2.size), Or(r, s3))
          break;
      }
      return t2;
    }
    tr.exports.untar = Ir;
  });
  or = D((se2, ir) => {
    u();
    var _r = w2(), Lr = x4(), Rr2 = er(), Gr = nr();
    _r.extend(ir.exports, Rr2, Gr, Lr);
  });
  u();
  u();
  g4 = L(or(), 1);
  Hr = ["application/x-gtar", "application/x-tar+gzip", "application/x-gzip", "application/gzip"];
  C2 = Vr + "/base";
  pr = { EBADF: 8, EBADFD: 127, EEXIST: 20, EINVAL: 28, EISDIR: 31, ENODEV: 43, ENOENT: 44, ENOTDIR: 54, ENOTEMPTY: 55 };
});

// node_modules/@electric-sql/pglite/dist/fs/nodefs.js
var exports_nodefs = {};
__export(exports_nodefs, {
  NodeFS: () => m3
});
import * as s3 from "fs";
import * as o3 from "path";
var m3;
var init_nodefs = __esm(() => {
  init_chunk_VV2EXAN2();
  init_chunk_BTBUZ646();
  u();
  m3 = class extends ur {
    constructor(t2) {
      super(t2), this.rootDir = o3.resolve(t2), s3.existsSync(o3.join(this.rootDir)) || s3.mkdirSync(this.rootDir);
    }
    async init(t2, e) {
      return this.pg = t2, { emscriptenOpts: { ...e, preRun: [...e.preRun || [], (r) => {
        let c2 = r.FS.filesystems.NODEFS;
        r.FS.mkdir(C2), r.FS.mount(c2, { root: this.rootDir }, C2);
      }] } };
    }
    async closeFs() {
      this.pg.Module.FS.quit();
    }
  };
});

// node_modules/@electric-sql/pglite/dist/fs/opfs-ahp.js
var exports_opfs_ahp = {};
__export(exports_opfs_ahp, {
  OpfsAhpFS: () => L4
});
var $2 = "state.txt", G2 = "data", T2, H3, v2, F4, M2, y3, b2, m4, x5, P3, D3, S2, n2, C3, O3, k, w3, f2, I, W2, j2, L4, p3;
var init_opfs_ahp = __esm(() => {
  init_chunk_VV2EXAN2();
  init_chunk_BTBUZ646();
  u();
  T2 = { DIR: 16384, FILE: 32768 };
  L4 = class extends cr {
    constructor(e, { initialPoolSize: t2 = 1000, maintainedPoolSize: o4 = 100, debug: i3 = false } = {}) {
      super(e, { debug: i3 });
      R(this, n2);
      R(this, H3);
      R(this, v2);
      R(this, F4);
      R(this, M2);
      R(this, y3);
      R(this, b2, new Map);
      R(this, m4, new Map);
      R(this, x5, 0);
      R(this, P3, new Map);
      R(this, D3, new Map);
      this.lastCheckpoint = 0;
      this.checkpointInterval = 1000 * 60;
      this.poolCounter = 0;
      R(this, S2, new Set);
      this.initialPoolSize = t2, this.maintainedPoolSize = o4;
    }
    async init(e, t2) {
      return await T(this, n2, C3).call(this), super.init(e, t2);
    }
    async syncToFs(e = false) {
      await this.maybeCheckpointState(), await this.maintainPool(), e || this.flush();
    }
    async closeFs() {
      for (let e of h(this, m4).values())
        e.close();
      h(this, y3).flush(), h(this, y3).close(), this.pg.Module.FS.quit();
    }
    async maintainPool(e) {
      e = e || this.maintainedPoolSize;
      let t2 = e - this.state.pool.length, o4 = [];
      for (let i3 = 0;i3 < t2; i3++)
        o4.push(new Promise(async (c2) => {
          ++this.poolCounter;
          let a2 = `${(Date.now() - 1704063600).toString(16).padStart(8, "0")}-${this.poolCounter.toString(16).padStart(8, "0")}`, h2 = await h(this, F4).getFileHandle(a2, { create: true }), d3 = await h2.createSyncAccessHandle();
          h(this, b2).set(a2, h2), h(this, m4).set(a2, d3), T(this, n2, k).call(this, { opp: "createPoolFile", args: [a2] }), this.state.pool.push(a2), c2();
        }));
      for (let i3 = 0;i3 > t2; i3--)
        o4.push(new Promise(async (c2) => {
          let a2 = this.state.pool.pop();
          T(this, n2, k).call(this, { opp: "deletePoolFile", args: [a2] });
          let h2 = h(this, b2).get(a2);
          h(this, m4).get(a2)?.close(), await h(this, F4).removeEntry(h2.name), h(this, b2).delete(a2), h(this, m4).delete(a2), c2();
        }));
      await Promise.all(o4);
    }
    _createPoolFileState(e) {
      this.state.pool.push(e);
    }
    _deletePoolFileState(e) {
      let t2 = this.state.pool.indexOf(e);
      t2 > -1 && this.state.pool.splice(t2, 1);
    }
    async maybeCheckpointState() {
      Date.now() - this.lastCheckpoint > this.checkpointInterval && await this.checkpointState();
    }
    async checkpointState() {
      let e = new TextEncoder().encode(JSON.stringify(this.state));
      h(this, y3).truncate(0), h(this, y3).write(e, { at: 0 }), h(this, y3).flush(), this.lastCheckpoint = Date.now();
    }
    flush() {
      for (let e of h(this, S2))
        try {
          e.flush();
        } catch {
        }
      h(this, S2).clear();
    }
    chmod(e, t2) {
      T(this, n2, O3).call(this, { opp: "chmod", args: [e, t2] }, () => {
        this._chmodState(e, t2);
      });
    }
    _chmodState(e, t2) {
      let o4 = T(this, n2, f2).call(this, e);
      o4.mode = t2;
    }
    close(e) {
      let t2 = T(this, n2, I).call(this, e);
      h(this, P3).delete(e), h(this, D3).delete(t2);
    }
    fstat(e) {
      let t2 = T(this, n2, I).call(this, e);
      return this.lstat(t2);
    }
    lstat(e) {
      let t2 = T(this, n2, f2).call(this, e), o4 = t2.type === "file" ? h(this, m4).get(t2.backingFilename).getSize() : 0, i3 = 4096;
      return { dev: 0, ino: 0, mode: t2.mode, nlink: 1, uid: 0, gid: 0, rdev: 0, size: o4, blksize: i3, blocks: Math.ceil(o4 / i3), atime: t2.lastModified, mtime: t2.lastModified, ctime: t2.lastModified };
    }
    mkdir(e, t2) {
      T(this, n2, O3).call(this, { opp: "mkdir", args: [e, t2] }, () => {
        this._mkdirState(e, t2);
      });
    }
    _mkdirState(e, t2) {
      let o4 = T(this, n2, w3).call(this, e), i3 = o4.pop(), c2 = [], a2 = this.state.root;
      for (let d3 of o4) {
        if (c2.push(e), !Object.prototype.hasOwnProperty.call(a2.children, d3))
          if (t2?.recursive)
            this.mkdir(c2.join("/"));
          else
            throw new p3("ENOENT", "No such file or directory");
        if (a2.children[d3].type !== "directory")
          throw new p3("ENOTDIR", "Not a directory");
        a2 = a2.children[d3];
      }
      if (Object.prototype.hasOwnProperty.call(a2.children, i3))
        throw new p3("EEXIST", "File exists");
      let h2 = { type: "directory", lastModified: Date.now(), mode: t2?.mode || T2.DIR, children: {} };
      a2.children[i3] = h2;
    }
    open(e, t2, o4) {
      if (T(this, n2, f2).call(this, e).type !== "file")
        throw new p3("EISDIR", "Is a directory");
      let c2 = T(this, n2, W2).call(this);
      return h(this, P3).set(c2, e), h(this, D3).set(e, c2), c2;
    }
    readdir(e) {
      let t2 = T(this, n2, f2).call(this, e);
      if (t2.type !== "directory")
        throw new p3("ENOTDIR", "Not a directory");
      return Object.keys(t2.children);
    }
    read(e, t2, o4, i3, c2) {
      let a2 = T(this, n2, I).call(this, e), h2 = T(this, n2, f2).call(this, a2);
      if (h2.type !== "file")
        throw new p3("EISDIR", "Is a directory");
      return h(this, m4).get(h2.backingFilename).read(new Uint8Array(t2.buffer, o4, i3), { at: c2 });
    }
    rename(e, t2) {
      T(this, n2, O3).call(this, { opp: "rename", args: [e, t2] }, () => {
        this._renameState(e, t2, true);
      });
    }
    _renameState(e, t2, o4 = false) {
      let i3 = T(this, n2, w3).call(this, e), c2 = i3.pop(), a2 = T(this, n2, f2).call(this, i3.join("/"));
      if (!Object.prototype.hasOwnProperty.call(a2.children, c2))
        throw new p3("ENOENT", "No such file or directory");
      let h2 = T(this, n2, w3).call(this, t2), d3 = h2.pop(), l3 = T(this, n2, f2).call(this, h2.join("/"));
      if (o4 && Object.prototype.hasOwnProperty.call(l3.children, d3)) {
        let u2 = l3.children[d3];
        h(this, m4).get(u2.backingFilename).truncate(0), this.state.pool.push(u2.backingFilename);
      }
      l3.children[d3] = a2.children[c2], delete a2.children[c2];
    }
    rmdir(e) {
      T(this, n2, O3).call(this, { opp: "rmdir", args: [e] }, () => {
        this._rmdirState(e);
      });
    }
    _rmdirState(e) {
      let t2 = T(this, n2, w3).call(this, e), o4 = t2.pop(), i3 = T(this, n2, f2).call(this, t2.join("/"));
      if (!Object.prototype.hasOwnProperty.call(i3.children, o4))
        throw new p3("ENOENT", "No such file or directory");
      let c2 = i3.children[o4];
      if (c2.type !== "directory")
        throw new p3("ENOTDIR", "Not a directory");
      if (Object.keys(c2.children).length > 0)
        throw new p3("ENOTEMPTY", "Directory not empty");
      delete i3.children[o4];
    }
    truncate(e, t2 = 0) {
      let o4 = T(this, n2, f2).call(this, e);
      if (o4.type !== "file")
        throw new p3("EISDIR", "Is a directory");
      let i3 = h(this, m4).get(o4.backingFilename);
      if (!i3)
        throw new p3("ENOENT", "No such file or directory");
      i3.truncate(t2), h(this, S2).add(i3);
    }
    unlink(e) {
      T(this, n2, O3).call(this, { opp: "unlink", args: [e] }, () => {
        this._unlinkState(e, true);
      });
    }
    _unlinkState(e, t2 = false) {
      let o4 = T(this, n2, w3).call(this, e), i3 = o4.pop(), c2 = T(this, n2, f2).call(this, o4.join("/"));
      if (!Object.prototype.hasOwnProperty.call(c2.children, i3))
        throw new p3("ENOENT", "No such file or directory");
      let a2 = c2.children[i3];
      if (a2.type !== "file")
        throw new p3("EISDIR", "Is a directory");
      if (delete c2.children[i3], t2) {
        let h2 = h(this, m4).get(a2.backingFilename);
        h2?.truncate(0), h(this, S2).add(h2), h(this, D3).has(e) && (h(this, P3).delete(h(this, D3).get(e)), h(this, D3).delete(e));
      }
      this.state.pool.push(a2.backingFilename);
    }
    utimes(e, t2, o4) {
      T(this, n2, O3).call(this, { opp: "utimes", args: [e, t2, o4] }, () => {
        this._utimesState(e, t2, o4);
      });
    }
    _utimesState(e, t2, o4) {
      let i3 = T(this, n2, f2).call(this, e);
      i3.lastModified = o4;
    }
    writeFile(e, t2, o4) {
      let i3 = T(this, n2, w3).call(this, e), c2 = i3.pop(), a2 = T(this, n2, f2).call(this, i3.join("/"));
      if (Object.prototype.hasOwnProperty.call(a2.children, c2)) {
        let l3 = a2.children[c2];
        l3.lastModified = Date.now(), T(this, n2, k).call(this, { opp: "setLastModified", args: [e, l3.lastModified] });
      } else {
        if (this.state.pool.length === 0)
          throw new Error("No more file handles available in the pool");
        let l3 = { type: "file", lastModified: Date.now(), mode: o4?.mode || T2.FILE, backingFilename: this.state.pool.pop() };
        a2.children[c2] = l3, T(this, n2, k).call(this, { opp: "createFileNode", args: [e, l3] });
      }
      let h2 = a2.children[c2], d3 = h(this, m4).get(h2.backingFilename);
      t2.length > 0 && (d3.write(typeof t2 == "string" ? new TextEncoder().encode(t2) : new Uint8Array(t2), { at: 0 }), e.startsWith("/pg_wal") && h(this, S2).add(d3));
    }
    _createFileNodeState(e, t2) {
      let o4 = T(this, n2, w3).call(this, e), i3 = o4.pop(), c2 = T(this, n2, f2).call(this, o4.join("/"));
      c2.children[i3] = t2;
      let a2 = this.state.pool.indexOf(t2.backingFilename);
      return a2 > -1 && this.state.pool.splice(a2, 1), t2;
    }
    _setLastModifiedState(e, t2) {
      let o4 = T(this, n2, f2).call(this, e);
      o4.lastModified = t2;
    }
    write(e, t2, o4, i3, c2) {
      let a2 = T(this, n2, I).call(this, e), h2 = T(this, n2, f2).call(this, a2);
      if (h2.type !== "file")
        throw new p3("EISDIR", "Is a directory");
      let d3 = h(this, m4).get(h2.backingFilename);
      if (!d3)
        throw new p3("EBADF", "Bad file descriptor");
      let l3 = d3.write(new Uint8Array(t2, o4, i3), { at: c2 });
      return a2.startsWith("/pg_wal") && h(this, S2).add(d3), l3;
    }
  };
  H3 = new WeakMap, v2 = new WeakMap, F4 = new WeakMap, M2 = new WeakMap, y3 = new WeakMap, b2 = new WeakMap, m4 = new WeakMap, x5 = new WeakMap, P3 = new WeakMap, D3 = new WeakMap, S2 = new WeakMap, n2 = new WeakSet, C3 = async function() {
    x(this, H3, await navigator.storage.getDirectory()), x(this, v2, await T(this, n2, j2).call(this, this.dataDir, { create: true })), x(this, F4, await T(this, n2, j2).call(this, G2, { from: h(this, v2), create: true })), x(this, M2, await h(this, v2).getFileHandle($2, { create: true })), x(this, y3, await h(this, M2).createSyncAccessHandle());
    let e = new ArrayBuffer(h(this, y3).getSize());
    h(this, y3).read(e, { at: 0 });
    let t2, o4 = new TextDecoder().decode(e).split(`
`), i3 = false;
    try {
      t2 = JSON.parse(o4[0]);
    } catch {
      t2 = { root: { type: "directory", lastModified: Date.now(), mode: T2.DIR, children: {} }, pool: [] }, h(this, y3).truncate(0), h(this, y3).write(new TextEncoder().encode(JSON.stringify(t2)), { at: 0 }), i3 = true;
    }
    this.state = t2;
    let c2 = o4.slice(1).filter(Boolean).map((l3) => JSON.parse(l3));
    for (let l3 of c2) {
      let u2 = `_${l3.opp}State`;
      if (typeof this[u2] == "function")
        try {
          this[u2].bind(this)(...l3.args);
        } catch (N2) {
          console.warn("Error applying OPFS AHP WAL entry", l3, N2);
        }
    }
    let a2 = [], h2 = async (l3) => {
      if (l3.type === "file")
        try {
          let u2 = await h(this, F4).getFileHandle(l3.backingFilename), N2 = await u2.createSyncAccessHandle();
          h(this, b2).set(l3.backingFilename, u2), h(this, m4).set(l3.backingFilename, N2);
        } catch (u2) {
          console.error("Error opening file handle for node", l3, u2);
        }
      else
        for (let u2 of Object.values(l3.children))
          a2.push(h2(u2));
    };
    await h2(this.state.root);
    let d3 = [];
    for (let l3 of this.state.pool)
      d3.push(new Promise(async (u2) => {
        h(this, b2).has(l3) && console.warn("File handle already exists for pool file", l3);
        let N2 = await h(this, F4).getFileHandle(l3), U3 = await N2.createSyncAccessHandle();
        h(this, b2).set(l3, N2), h(this, m4).set(l3, U3), u2();
      }));
    await Promise.all([...a2, ...d3]), await this.maintainPool(i3 ? this.initialPoolSize : this.maintainedPoolSize);
  }, O3 = function(e, t2) {
    let o4 = T(this, n2, k).call(this, e);
    try {
      t2();
    } catch (i3) {
      throw h(this, y3).truncate(o4), i3;
    }
  }, k = function(e) {
    let t2 = JSON.stringify(e), o4 = new TextEncoder().encode(`
${t2}`), i3 = h(this, y3).getSize();
    return h(this, y3).write(o4, { at: i3 }), h(this, S2).add(h(this, y3)), i3;
  }, w3 = function(e) {
    return e.split("/").filter(Boolean);
  }, f2 = function(e, t2) {
    let o4 = T(this, n2, w3).call(this, e), i3 = t2 || this.state.root;
    for (let c2 of o4) {
      if (i3.type !== "directory")
        throw new p3("ENOTDIR", "Not a directory");
      if (!Object.prototype.hasOwnProperty.call(i3.children, c2))
        throw new p3("ENOENT", "No such file or directory");
      i3 = i3.children[c2];
    }
    return i3;
  }, I = function(e) {
    let t2 = h(this, P3).get(e);
    if (!t2)
      throw new p3("EBADF", "Bad file descriptor");
    return t2;
  }, W2 = function() {
    let e = ++U(this, x5)._;
    for (;h(this, P3).has(e); )
      U(this, x5)._++;
    return e;
  }, j2 = async function(e, t2) {
    let o4 = T(this, n2, w3).call(this, e), i3 = t2?.from || h(this, H3);
    for (let c2 of o4)
      i3 = await i3.getDirectoryHandle(c2, { create: t2?.create });
    return i3;
  };
  p3 = class extends Error {
    constructor(A2, e) {
      super(e), typeof A2 == "number" ? this.code = A2 : typeof A2 == "string" && (this.code = pr[A2]);
    }
  };
});

// node_modules/@electric-sql/pglite/dist/chunk-M6G2OE44.js
init_chunk_BTBUZ646();
function ue(e, t, n2) {
  if (e === null)
    return null;
  let r = n2?.[t] ?? Se.parsers[t];
  return r ? r(e, t) : e;
}
function pn(e) {
  return Object.keys(e).reduce(({ parsers: t, serializers: n2 }, r) => {
    let { to: i3, from: a2, serialize: u2, parse: d2 } = e[r];
    return n2[i3] = u2, n2[r] = u2, t[r] = d2, Array.isArray(a2) ? a2.forEach((c2) => {
      t[c2] = d2, n2[c2] = u2;
    }) : (t[a2] = d2, n2[a2] = u2), { parsers: t, serializers: n2 };
  }, { parsers: {}, serializers: {} });
}
function mn(e) {
  return e.replace(dn, "\\\\").replace(fn, '\\"');
}
function Ke(e, t, n2) {
  if (Array.isArray(e) === false)
    return e;
  if (!e.length)
    return "{}";
  let r = e[0], i3 = n2 === 1020 ? ";" : ",";
  return Array.isArray(r) ? `{${e.map((a2) => Ke(a2, t, n2)).join(i3)}}` : `{${e.map((a2) => (a2 === undefined && (a2 = null), a2 === null ? "null" : '"' + mn(t ? t(a2) : a2.toString()) + '"')).join(i3)}}`;
}
function yn(e, t, n2) {
  return he.i = he.last = 0, Je(he, e, t, n2)[0];
}
function Je(e, t, n2, r) {
  let i3 = [], a2 = r === 1020 ? ";" : ",";
  for (;e.i < t.length; e.i++) {
    if (e.char = t[e.i], e.quoted)
      e.char === "\\" ? e.str += t[++e.i] : e.char === '"' ? (i3.push(n2 ? n2(e.str) : e.str), e.str = "", e.quoted = t[e.i + 1] === '"', e.last = e.i + 2) : e.str += e.char;
    else if (e.char === '"')
      e.quoted = true;
    else if (e.char === "{")
      e.last = ++e.i, i3.push(Je(e, t, n2, r));
    else if (e.char === "}") {
      e.quoted = false, e.last < e.i && i3.push(n2 ? n2(t.slice(e.last, e.i)) : t.slice(e.last, e.i)), e.last = e.i + 1;
      break;
    } else
      e.char === a2 && e.p !== "}" && e.p !== '"' && (i3.push(n2 ? n2(t.slice(e.last, e.i)) : t.slice(e.last, e.i)), e.last = e.i + 1);
    e.p = e.char;
  }
  return e.last < e.i && i3.push(n2 ? n2(t.slice(e.last, e.i + 1)) : t.slice(e.last, e.i + 1)), i3;
}
function bn(e, t, n2, r) {
  let i3 = [], a2 = { rows: [], fields: [] }, u2 = 0, d2 = { ...t, ...n2?.parsers };
  return e.forEach((c2) => {
    switch (c2.name) {
      case "rowDescription": {
        let k = c2;
        a2.fields = k.fields.map((T2) => ({ name: T2.name, dataTypeID: T2.dataTypeID }));
        break;
      }
      case "dataRow": {
        if (!a2)
          break;
        let k = c2;
        n2?.rowMode === "array" ? a2.rows.push(k.fields.map((T2, ie) => ue(T2, a2.fields[ie].dataTypeID, d2))) : a2.rows.push(Object.fromEntries(k.fields.map((T2, ie) => [a2.fields[ie].name, ue(T2, a2.fields[ie].dataTypeID, d2)])));
        break;
      }
      case "commandComplete": {
        u2 += gn(c2), i3.push({ ...a2, affectedRows: u2, ...r ? { blob: r } : {} }), a2 = { rows: [], fields: [] };
        break;
      }
    }
  }), i3.length === 0 && i3.push({ affectedRows: 0, rows: [], fields: [] }), i3;
}
function gn(e) {
  let t = e.text.split(" ");
  switch (t[0]) {
    case "INSERT":
      return parseInt(t[2], 10);
    case "UPDATE":
    case "DELETE":
    case "COPY":
    case "MERGE":
      return parseInt(t[1], 10);
    default:
      return 0;
  }
}
function De(e) {
  let t = e.find((n2) => n2.name === "parameterDescription");
  return t ? t.dataTypeIDs : [];
}
function C(e) {
  let t = e.length;
  for (let n2 = e.length - 1;n2 >= 0; n2--) {
    let r = e.charCodeAt(n2);
    r > 127 && r <= 2047 ? t++ : r > 2047 && r <= 65535 && (t += 2), r >= 56320 && r <= 57343 && n2--;
  }
  return t;
}
async function Rr() {
  if (Fe || se)
    return;
  let e = new URL("./pglite.wasm", import.meta.url);
  se = fetch(e);
}
async function Tr(e, t) {
  if (t || re)
    return { instance: await WebAssembly.instantiate(t || re, e), module: t || re };
  let n2 = new URL("./pglite.wasm", import.meta.url);
  if (Fe) {
    let i3 = await (await import("fs/promises")).readFile(n2), { module: a2, instance: u2 } = await WebAssembly.instantiate(i3, e);
    return re = a2, { instance: u2, module: a2 };
  } else {
    se || (se = fetch(n2));
    let r = await se, { module: i3, instance: a2 } = await WebAssembly.instantiateStreaming(r, e);
    return re = i3, { instance: a2, module: i3 };
  }
}
async function Er() {
  let e = new URL("./pglite.data", import.meta.url);
  return Fe ? (await (await import("fs/promises")).readFile(e)).buffer : (await fetch(e)).arrayBuffer();
}
function Nr(e) {
  let t;
  return e.startsWith('"') && e.endsWith('"') ? t = e.substring(1, e.length - 1) : t = e.toLowerCase(), t;
}
var hn = {};
F(hn, { ABSTIME: () => Et, ACLITEM: () => Vt, BIT: () => jt, BOOL: () => be, BPCHAR: () => _e, BYTEA: () => ge, CHAR: () => gt, CID: () => St, CIDR: () => Tt, CIRCLE: () => Ut, DATE: () => He, FLOAT4: () => Qe, FLOAT8: () => We, GTSVECTOR: () => rn, INET: () => kt, INT2: () => ve, INT4: () => Ge, INT8: () => we, INTERVAL: () => vt, JSON: () => Ae, JSONB: () => Ye, MACADDR: () => Ot, MACADDR8: () => Nt, MONEY: () => Lt, NUMERIC: () => Wt, OID: () => je, PATH: () => Mt, PG_DEPENDENCIES: () => en, PG_LSN: () => Xt, PG_NDISTINCT: () => Zt, PG_NODE_TREE: () => Bt, POLYGON: () => Rt, REFCURSOR: () => _t, REGCLASS: () => Yt, REGCONFIG: () => sn, REGDICTIONARY: () => an, REGNAMESPACE: () => on, REGOPER: () => Ht, REGOPERATOR: () => qt, REGPROC: () => wt, REGPROCEDURE: () => zt, REGROLE: () => un, REGTYPE: () => $t, RELTIME: () => Ct, SMGR: () => It, TEXT: () => V, TID: () => At, TIME: () => Ft, TIMESTAMP: () => qe, TIMESTAMPTZ: () => xe, TIMETZ: () => Gt, TINTERVAL: () => Pt, TSQUERY: () => nn, TSVECTOR: () => tn, TXID_SNAPSHOT: () => Jt, UUID: () => Kt, VARBIT: () => Qt, VARCHAR: () => ze, XID: () => xt, XML: () => Dt, arrayParser: () => yn, arraySerializer: () => Ke, parseType: () => ue, parsers: () => ln, serializers: () => cn, types: () => $e });
u();
var ht = globalThis.JSON.parse;
var bt = globalThis.JSON.stringify;
var be = 16;
var ge = 17;
var gt = 18;
var we = 20;
var ve = 21;
var Ge = 23;
var wt = 24;
var V = 25;
var je = 26;
var At = 27;
var xt = 28;
var St = 29;
var Ae = 114;
var Dt = 142;
var Bt = 194;
var It = 210;
var Mt = 602;
var Rt = 604;
var Tt = 650;
var Qe = 700;
var We = 701;
var Et = 702;
var Ct = 703;
var Pt = 704;
var Ut = 718;
var Nt = 774;
var Lt = 790;
var Ot = 829;
var kt = 869;
var Vt = 1033;
var _e = 1042;
var ze = 1043;
var He = 1082;
var Ft = 1083;
var qe = 1114;
var xe = 1184;
var vt = 1186;
var Gt = 1266;
var jt = 1560;
var Qt = 1562;
var Wt = 1700;
var _t = 1790;
var zt = 2202;
var Ht = 2203;
var qt = 2204;
var Yt = 2205;
var $t = 2206;
var Kt = 2950;
var Jt = 2970;
var Xt = 3220;
var Zt = 3361;
var en = 3402;
var tn = 3614;
var nn = 3615;
var rn = 3642;
var sn = 3734;
var an = 3769;
var Ye = 3802;
var on = 4089;
var un = 4096;
var $e = { string: { to: V, from: [V, ze, _e], serialize: (e) => {
  if (typeof e == "string")
    return e;
  if (typeof e == "number")
    return e.toString();
  throw new Error("Invalid input for string type");
}, parse: (e) => e }, number: { to: 0, from: [ve, Ge, je, Qe, We], serialize: (e) => e.toString(), parse: (e) => +e }, bigint: { to: we, from: [we], serialize: (e) => e.toString(), parse: (e) => {
  let t = BigInt(e);
  return t < Number.MIN_SAFE_INTEGER || t > Number.MAX_SAFE_INTEGER ? t : Number(t);
} }, json: { to: Ae, from: [Ae, Ye], serialize: (e) => typeof e == "string" ? e : bt(e), parse: (e) => ht(e) }, boolean: { to: be, from: [be], serialize: (e) => {
  if (typeof e != "boolean")
    throw new Error("Invalid input for boolean type");
  return e ? "t" : "f";
}, parse: (e) => e === "t" }, date: { to: xe, from: [He, qe, xe], serialize: (e) => {
  if (typeof e == "string")
    return e;
  if (typeof e == "number")
    return new Date(e).toISOString();
  if (e instanceof Date)
    return e.toISOString();
  throw new Error("Invalid input for date type");
}, parse: (e) => new Date(e) }, bytea: { to: ge, from: [ge], serialize: (e) => {
  if (!(e instanceof Uint8Array))
    throw new Error("Invalid input for bytea type");
  return "\\x" + Array.from(e).map((t) => t.toString(16).padStart(2, "0")).join("");
}, parse: (e) => {
  let t = e.slice(2);
  return Uint8Array.from({ length: t.length / 2 }, (n2, r) => parseInt(t.substring(r * 2, (r + 1) * 2), 16));
} } };
var Se = pn($e);
var ln = Se.parsers;
var cn = Se.serializers;
var dn = /\\/g;
var fn = /"/g;
var he = { i: 0, char: null, str: "", quoted: false, last: 0, p: null };
var wn = {};
F(wn, { parseDescribeStatementResults: () => De, parseResults: () => bn });
u();
var Ue = {};
F(Ue, { AuthenticationCleartextPassword: () => v, AuthenticationMD5Password: () => G, AuthenticationOk: () => F2, AuthenticationSASL: () => j, AuthenticationSASLContinue: () => Q, AuthenticationSASLFinal: () => W, BackendKeyDataMessage: () => K, CommandCompleteMessage: () => Z, CopyDataMessage: () => _2, CopyResponse: () => z, DataRowMessage: () => ee, DatabaseError: () => E, Field: () => H, NoticeMessage: () => te, NotificationResponseMessage: () => J, ParameterDescriptionMessage: () => Y, ParameterStatusMessage: () => $, ReadyForQueryMessage: () => X, RowDescriptionMessage: () => q, bindComplete: () => Ie, closeComplete: () => Me, copyDone: () => Pe, emptyQuery: () => Ce, noData: () => Re, parseComplete: () => Be, portalSuspended: () => Te, replicationStart: () => Ee });
u();
var Be = { name: "parseComplete", length: 5 };
var Ie = { name: "bindComplete", length: 5 };
var Me = { name: "closeComplete", length: 5 };
var Re = { name: "noData", length: 5 };
var Te = { name: "portalSuspended", length: 5 };
var Ee = { name: "replicationStart", length: 4 };
var Ce = { name: "emptyQuery", length: 4 };
var Pe = { name: "copyDone", length: 4 };
var F2 = class {
  constructor(t) {
    this.length = t;
    this.name = "authenticationOk";
  }
};
var v = class {
  constructor(t) {
    this.length = t;
    this.name = "authenticationCleartextPassword";
  }
};
var G = class {
  constructor(t, n2) {
    this.length = t;
    this.salt = n2;
    this.name = "authenticationMD5Password";
  }
};
var j = class {
  constructor(t, n2) {
    this.length = t;
    this.mechanisms = n2;
    this.name = "authenticationSASL";
  }
};
var Q = class {
  constructor(t, n2) {
    this.length = t;
    this.data = n2;
    this.name = "authenticationSASLContinue";
  }
};
var W = class {
  constructor(t, n2) {
    this.length = t;
    this.data = n2;
    this.name = "authenticationSASLFinal";
  }
};
var E = class extends Error {
  constructor(n2, r, i3) {
    super(n2);
    this.length = r;
    this.name = i3;
  }
};
var _2 = class {
  constructor(t, n2) {
    this.length = t;
    this.chunk = n2;
    this.name = "copyData";
  }
};
var z = class {
  constructor(t, n2, r, i3) {
    this.length = t;
    this.name = n2;
    this.binary = r;
    this.columnTypes = new Array(i3);
  }
};
var H = class {
  constructor(t, n2, r, i3, a2, u2, d2) {
    this.name = t;
    this.tableID = n2;
    this.columnID = r;
    this.dataTypeID = i3;
    this.dataTypeSize = a2;
    this.dataTypeModifier = u2;
    this.format = d2;
  }
};
var q = class {
  constructor(t, n2) {
    this.length = t;
    this.fieldCount = n2;
    this.name = "rowDescription";
    this.fields = new Array(this.fieldCount);
  }
};
var Y = class {
  constructor(t, n2) {
    this.length = t;
    this.parameterCount = n2;
    this.name = "parameterDescription";
    this.dataTypeIDs = new Array(this.parameterCount);
  }
};
var $ = class {
  constructor(t, n2, r) {
    this.length = t;
    this.parameterName = n2;
    this.parameterValue = r;
    this.name = "parameterStatus";
  }
};
var K = class {
  constructor(t, n2, r) {
    this.length = t;
    this.processID = n2;
    this.secretKey = r;
    this.name = "backendKeyData";
  }
};
var J = class {
  constructor(t, n2, r, i3) {
    this.length = t;
    this.processId = n2;
    this.channel = r;
    this.payload = i3;
    this.name = "notification";
  }
};
var X = class {
  constructor(t, n2) {
    this.length = t;
    this.status = n2;
    this.name = "readyForQuery";
  }
};
var Z = class {
  constructor(t, n2) {
    this.length = t;
    this.text = n2;
    this.name = "commandComplete";
  }
};
var ee = class {
  constructor(t, n2) {
    this.length = t;
    this.fields = n2;
    this.name = "dataRow";
    this.fieldCount = n2.length;
  }
};
var te = class {
  constructor(t, n2) {
    this.length = t;
    this.message = n2;
    this.name = "notice";
  }
};
var zn = {};
F(zn, { Parser: () => ye, messages: () => Ue, serialize: () => O });
u();
u();
u();
u();
var b;
var g2;
var U2;
var ce;
var N;
var x2;
var le;
var P2;
var Xe;
var R2 = class {
  constructor(t = 256) {
    this.size = t;
    R(this, x2);
    R(this, b);
    R(this, g2, 5);
    R(this, U2, false);
    R(this, ce, new TextEncoder);
    R(this, N, 0);
    x(this, b, T(this, x2, le).call(this, t));
  }
  addInt32(t) {
    return T(this, x2, P2).call(this, 4), h(this, b).setInt32(h(this, g2), t, h(this, U2)), x(this, g2, h(this, g2) + 4), this;
  }
  addInt16(t) {
    return T(this, x2, P2).call(this, 2), h(this, b).setInt16(h(this, g2), t, h(this, U2)), x(this, g2, h(this, g2) + 2), this;
  }
  addCString(t) {
    return t && this.addString(t), T(this, x2, P2).call(this, 1), h(this, b).setUint8(h(this, g2), 0), U(this, g2)._++, this;
  }
  addString(t = "") {
    let n2 = C(t);
    return T(this, x2, P2).call(this, n2), h(this, ce).encodeInto(t, new Uint8Array(h(this, b).buffer, h(this, g2))), x(this, g2, h(this, g2) + n2), this;
  }
  add(t) {
    return T(this, x2, P2).call(this, t.byteLength), new Uint8Array(h(this, b).buffer).set(new Uint8Array(t), h(this, g2)), x(this, g2, h(this, g2) + t.byteLength), this;
  }
  flush(t) {
    let n2 = T(this, x2, Xe).call(this, t);
    return x(this, g2, 5), x(this, b, T(this, x2, le).call(this, this.size)), new Uint8Array(n2);
  }
};
b = new WeakMap, g2 = new WeakMap, U2 = new WeakMap, ce = new WeakMap, N = new WeakMap, x2 = new WeakSet, le = function(t) {
  return new DataView(new ArrayBuffer(t));
}, P2 = function(t) {
  if (h(this, b).byteLength - h(this, g2) < t) {
    let r = h(this, b).buffer, i3 = r.byteLength + (r.byteLength >> 1) + t;
    x(this, b, T(this, x2, le).call(this, i3)), new Uint8Array(h(this, b).buffer).set(new Uint8Array(r));
  }
}, Xe = function(t) {
  if (t) {
    h(this, b).setUint8(h(this, N), t);
    let n2 = h(this, g2) - (h(this, N) + 1);
    h(this, b).setInt32(h(this, N) + 1, n2, h(this, U2));
  }
  return h(this, b).buffer.slice(t ? 0 : 5, h(this, g2));
};
var m = new R2;
var An = (e) => {
  m.addInt16(3).addInt16(0);
  for (let r of Object.keys(e))
    m.addCString(r).addCString(e[r]);
  m.addCString("client_encoding").addCString("UTF8");
  let t = m.addCString("").flush(), n2 = t.byteLength + 4;
  return new R2().addInt32(n2).add(t).flush();
};
var xn = () => {
  let e = new DataView(new ArrayBuffer(8));
  return e.setInt32(0, 8, false), e.setInt32(4, 80877103, false), new Uint8Array(e.buffer);
};
var Sn = (e) => m.addCString(e).flush(112);
var Dn = (e, t) => (m.addCString(e).addInt32(C(t)).addString(t), m.flush(112));
var Bn = (e) => m.addString(e).flush(112);
var In = (e) => m.addCString(e).flush(81);
var Mn = [];
var Rn = (e) => {
  let t = e.name ?? "";
  t.length > 63 && (console.error("Warning! Postgres only supports 63 characters for query names."), console.error("You supplied %s (%s)", t, t.length), console.error("This can cause conflicts and silent errors executing queries"));
  let n2 = m.addCString(t).addCString(e.text).addInt16(e.types?.length ?? 0);
  return e.types?.forEach((r) => n2.addInt32(r)), m.flush(80);
};
var L2 = new R2;
var Tn = (e, t) => {
  for (let n2 = 0;n2 < e.length; n2++) {
    let r = t ? t(e[n2], n2) : e[n2];
    if (r === null)
      m.addInt16(0), L2.addInt32(-1);
    else if (r instanceof ArrayBuffer || ArrayBuffer.isView(r)) {
      let i3 = ArrayBuffer.isView(r) ? r.buffer.slice(r.byteOffset, r.byteOffset + r.byteLength) : r;
      m.addInt16(1), L2.addInt32(i3.byteLength), L2.add(i3);
    } else
      m.addInt16(0), L2.addInt32(C(r)), L2.addString(r);
  }
};
var En = (e = {}) => {
  let t = e.portal ?? "", n2 = e.statement ?? "", r = e.binary ?? false, i3 = e.values ?? Mn, a2 = i3.length;
  return m.addCString(t).addCString(n2), m.addInt16(a2), Tn(i3, e.valueMapper), m.addInt16(a2), m.add(L2.flush()), m.addInt16(r ? 1 : 0), m.flush(66);
};
var Cn = new Uint8Array([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]);
var Pn = (e) => {
  if (!e || !e.portal && !e.rows)
    return Cn;
  let t = e.portal ?? "", n2 = e.rows ?? 0, r = C(t), i3 = 4 + r + 1 + 4, a2 = new DataView(new ArrayBuffer(1 + i3));
  return a2.setUint8(0, 69), a2.setInt32(1, i3, false), new TextEncoder().encodeInto(t, new Uint8Array(a2.buffer, 5)), a2.setUint8(r + 5, 0), a2.setUint32(a2.byteLength - 4, n2, false), new Uint8Array(a2.buffer);
};
var Un = (e, t) => {
  let n2 = new DataView(new ArrayBuffer(16));
  return n2.setInt32(0, 16, false), n2.setInt16(4, 1234, false), n2.setInt16(6, 5678, false), n2.setInt32(8, e, false), n2.setInt32(12, t, false), new Uint8Array(n2.buffer);
};
var Ne = (e, t) => {
  let n2 = new R2;
  return n2.addCString(t), n2.flush(e);
};
var Nn = m.addCString("P").flush(68);
var Ln = m.addCString("S").flush(68);
var On = (e) => e.name ? Ne(68, `${e.type}${e.name ?? ""}`) : e.type === "P" ? Nn : Ln;
var kn = (e) => {
  let t = `${e.type}${e.name ?? ""}`;
  return Ne(67, t);
};
var Vn = (e) => m.add(e).flush(100);
var Fn = (e) => Ne(102, e);
var pe = (e) => new Uint8Array([e, 0, 0, 0, 4]);
var vn = pe(72);
var Gn = pe(83);
var jn = pe(88);
var Qn = pe(99);
var O = { startup: An, password: Sn, requestSsl: xn, sendSASLInitialResponseMessage: Dn, sendSCRAMClientFinalMessage: Bn, query: In, parse: Rn, bind: En, execute: Pn, describe: On, close: kn, flush: () => vn, sync: () => Gn, end: () => jn, copyData: Vn, copyDone: () => Qn, copyFail: Fn, cancel: Un };
u();
u();
var Le = { text: 0, binary: 1 };
u();
var Wn = new ArrayBuffer(0);
var M;
var w;
var fe;
var me;
var ne;
var de = class {
  constructor(t = 0) {
    R(this, M, new DataView(Wn));
    R(this, w);
    R(this, fe, "utf-8");
    R(this, me, new TextDecoder(h(this, fe)));
    R(this, ne, false);
    x(this, w, t);
  }
  setBuffer(t, n2) {
    x(this, w, t), x(this, M, new DataView(n2));
  }
  int16() {
    let t = h(this, M).getInt16(h(this, w), h(this, ne));
    return x(this, w, h(this, w) + 2), t;
  }
  byte() {
    let t = h(this, M).getUint8(h(this, w));
    return U(this, w)._++, t;
  }
  int32() {
    let t = h(this, M).getInt32(h(this, w), h(this, ne));
    return x(this, w, h(this, w) + 4), t;
  }
  string(t) {
    return h(this, me).decode(this.bytes(t));
  }
  cstring() {
    let t = h(this, w), n2 = t;
    for (;h(this, M).getUint8(n2++) !== 0; )
      ;
    let r = this.string(n2 - t - 1);
    return x(this, w, n2), r;
  }
  bytes(t) {
    let n2 = h(this, M).buffer.slice(h(this, w), h(this, w) + t);
    return x(this, w, h(this, w) + t), new Uint8Array(n2);
  }
};
M = new WeakMap, w = new WeakMap, fe = new WeakMap, me = new WeakMap, ne = new WeakMap;
var Oe = 1;
var _n = 4;
var Ze = Oe + _n;
var et = new ArrayBuffer(0);
var A;
var S;
var D2;
var o;
var l2;
var tt;
var nt;
var rt;
var st;
var it;
var at;
var ot;
var ke;
var ut;
var lt;
var ct;
var pt;
var dt;
var ft;
var mt;
var yt;
var Ve;
var ye = class {
  constructor() {
    R(this, l2);
    R(this, A, new DataView(et));
    R(this, S, 0);
    R(this, D2, 0);
    R(this, o, new de);
  }
  parse(t, n2) {
    T(this, l2, tt).call(this, ArrayBuffer.isView(t) ? t.buffer.slice(t.byteOffset, t.byteOffset + t.byteLength) : t);
    let r = h(this, D2) + h(this, S), i3 = h(this, D2);
    for (;i3 + Ze <= r; ) {
      let a2 = h(this, A).getUint8(i3), u2 = h(this, A).getUint32(i3 + Oe, false), d2 = Oe + u2;
      if (d2 + i3 <= r) {
        let c2 = T(this, l2, nt).call(this, i3 + Ze, a2, u2, h(this, A).buffer);
        n2(c2), i3 += d2;
      } else
        break;
    }
    i3 === r ? (x(this, A, new DataView(et)), x(this, S, 0), x(this, D2, 0)) : (x(this, S, r - i3), x(this, D2, i3));
  }
};
A = new WeakMap, S = new WeakMap, D2 = new WeakMap, o = new WeakMap, l2 = new WeakSet, tt = function(t) {
  if (h(this, S) > 0) {
    let n2 = h(this, S) + t.byteLength;
    if (n2 + h(this, D2) > h(this, A).byteLength) {
      let i3;
      if (n2 <= h(this, A).byteLength && h(this, D2) >= h(this, S))
        i3 = h(this, A).buffer;
      else {
        let a2 = h(this, A).byteLength * 2;
        for (;n2 >= a2; )
          a2 *= 2;
        i3 = new ArrayBuffer(a2);
      }
      new Uint8Array(i3).set(new Uint8Array(h(this, A).buffer, h(this, D2), h(this, S))), x(this, A, new DataView(i3)), x(this, D2, 0);
    }
    new Uint8Array(h(this, A).buffer).set(new Uint8Array(t), h(this, D2) + h(this, S)), x(this, S, n2);
  } else
    x(this, A, new DataView(t)), x(this, D2, 0), x(this, S, t.byteLength);
}, nt = function(t, n2, r, i3) {
  switch (n2) {
    case 50:
      return Ie;
    case 49:
      return Be;
    case 51:
      return Me;
    case 110:
      return Re;
    case 115:
      return Te;
    case 99:
      return Pe;
    case 87:
      return Ee;
    case 73:
      return Ce;
    case 68:
      return T(this, l2, dt).call(this, t, r, i3);
    case 67:
      return T(this, l2, st).call(this, t, r, i3);
    case 90:
      return T(this, l2, rt).call(this, t, r, i3);
    case 65:
      return T(this, l2, ut).call(this, t, r, i3);
    case 82:
      return T(this, l2, yt).call(this, t, r, i3);
    case 83:
      return T(this, l2, ft).call(this, t, r, i3);
    case 75:
      return T(this, l2, mt).call(this, t, r, i3);
    case 69:
      return T(this, l2, Ve).call(this, t, r, i3, "error");
    case 78:
      return T(this, l2, Ve).call(this, t, r, i3, "notice");
    case 84:
      return T(this, l2, lt).call(this, t, r, i3);
    case 116:
      return T(this, l2, pt).call(this, t, r, i3);
    case 71:
      return T(this, l2, at).call(this, t, r, i3);
    case 72:
      return T(this, l2, ot).call(this, t, r, i3);
    case 100:
      return T(this, l2, it).call(this, t, r, i3);
    default:
      return new E("received invalid response: " + n2.toString(16), r, "error");
  }
}, rt = function(t, n2, r) {
  h(this, o).setBuffer(t, r);
  let i3 = h(this, o).string(1);
  return new X(n2, i3);
}, st = function(t, n2, r) {
  h(this, o).setBuffer(t, r);
  let i3 = h(this, o).cstring();
  return new Z(n2, i3);
}, it = function(t, n2, r) {
  let i3 = r.slice(t, t + (n2 - 4));
  return new _2(n2, new Uint8Array(i3));
}, at = function(t, n2, r) {
  return T(this, l2, ke).call(this, t, n2, r, "copyInResponse");
}, ot = function(t, n2, r) {
  return T(this, l2, ke).call(this, t, n2, r, "copyOutResponse");
}, ke = function(t, n2, r, i3) {
  h(this, o).setBuffer(t, r);
  let a2 = h(this, o).byte() !== 0, u2 = h(this, o).int16(), d2 = new z(n2, i3, a2, u2);
  for (let c2 = 0;c2 < u2; c2++)
    d2.columnTypes[c2] = h(this, o).int16();
  return d2;
}, ut = function(t, n2, r) {
  h(this, o).setBuffer(t, r);
  let i3 = h(this, o).int32(), a2 = h(this, o).cstring(), u2 = h(this, o).cstring();
  return new J(n2, i3, a2, u2);
}, lt = function(t, n2, r) {
  h(this, o).setBuffer(t, r);
  let i3 = h(this, o).int16(), a2 = new q(n2, i3);
  for (let u2 = 0;u2 < i3; u2++)
    a2.fields[u2] = T(this, l2, ct).call(this);
  return a2;
}, ct = function() {
  let t = h(this, o).cstring(), n2 = h(this, o).int32(), r = h(this, o).int16(), i3 = h(this, o).int32(), a2 = h(this, o).int16(), u2 = h(this, o).int32(), d2 = h(this, o).int16() === 0 ? Le.text : Le.binary;
  return new H(t, n2, r, i3, a2, u2, d2);
}, pt = function(t, n2, r) {
  h(this, o).setBuffer(t, r);
  let i3 = h(this, o).int16(), a2 = new Y(n2, i3);
  for (let u2 = 0;u2 < i3; u2++)
    a2.dataTypeIDs[u2] = h(this, o).int32();
  return a2;
}, dt = function(t, n2, r) {
  h(this, o).setBuffer(t, r);
  let i3 = h(this, o).int16(), a2 = new Array(i3);
  for (let u2 = 0;u2 < i3; u2++) {
    let d2 = h(this, o).int32();
    a2[u2] = d2 === -1 ? null : h(this, o).string(d2);
  }
  return new ee(n2, a2);
}, ft = function(t, n2, r) {
  h(this, o).setBuffer(t, r);
  let i3 = h(this, o).cstring(), a2 = h(this, o).cstring();
  return new $(n2, i3, a2);
}, mt = function(t, n2, r) {
  h(this, o).setBuffer(t, r);
  let i3 = h(this, o).int32(), a2 = h(this, o).int32();
  return new K(n2, i3, a2);
}, yt = function(t, n2, r) {
  h(this, o).setBuffer(t, r);
  let i3 = h(this, o).int32();
  switch (i3) {
    case 0:
      return new F2(n2);
    case 3:
      return new v(n2);
    case 5:
      return new G(n2, h(this, o).bytes(4));
    case 10: {
      let a2 = [];
      for (;; ) {
        let u2 = h(this, o).cstring();
        if (u2.length === 0)
          return new j(n2, a2);
        a2.push(u2);
      }
    }
    case 11:
      return new Q(n2, h(this, o).string(n2 - 8));
    case 12:
      return new W(n2, h(this, o).string(n2 - 8));
    default:
      throw new Error("Unknown authenticationOk message type " + i3);
  }
}, Ve = function(t, n2, r, i3) {
  h(this, o).setBuffer(t, r);
  let a2 = {}, u2 = h(this, o).string(1);
  for (;u2 !== "\0"; )
    a2[u2] = h(this, o).cstring(), u2 = h(this, o).string(1);
  let d2 = a2.M, c2 = i3 === "notice" ? new te(n2, d2) : new E(d2, n2, i3);
  return c2.severity = a2.S, c2.code = a2.C, c2.detail = a2.D, c2.hint = a2.H, c2.position = a2.P, c2.internalPosition = a2.p, c2.internalQuery = a2.q, c2.where = a2.W, c2.schema = a2.s, c2.table = a2.t, c2.column = a2.c, c2.dataType = a2.d, c2.constraint = a2.n, c2.file = a2.F, c2.line = a2.L, c2.routine = a2.R, c2;
};
u();
var Fe = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";
var se;
var re;

// node_modules/@electric-sql/pglite/dist/chunk-STOZMFXW.js
init_chunk_BTBUZ646();
function s2(t, r, ...e) {
  let a2 = t.length - 1, p2 = e.length - 1;
  if (p2 !== -1) {
    if (p2 === 0) {
      t[a2] = t[a2] + e[0] + r;
      return;
    }
    t[a2] = t[a2] + e[0], t.push(...e.slice(1, p2)), t.push(e[p2] + r);
  }
}
function y(t, ...r) {
  let e = [t[0]];
  e.raw = [t.raw[0]];
  let a2 = [];
  for (let p2 = 0;p2 < r.length; p2++) {
    let n2 = r[p2], i3 = p2 + 1;
    if (n2?._templateType === o2.part) {
      s2(e, t[i3], n2.str), s2(e.raw, t.raw[i3], n2.str);
      continue;
    }
    if (n2?._templateType === o2.container) {
      s2(e, t[i3], ...n2.strings), s2(e.raw, t.raw[i3], ...n2.strings.raw), a2.push(...n2.values);
      continue;
    }
    e.push(t[i3]), e.raw.push(t.raw[i3]), a2.push(n2);
  }
  return { _templateType: "container", strings: e, values: a2 };
}
function g3(t, ...r) {
  let { strings: e, values: a2 } = y(t, ...r);
  return { query: [e[0], ...a2.flatMap((p2, n2) => [`\$${n2 + 1}`, e[n2 + 1]])].join(""), params: a2 };
}
u();
var o2 = { part: "part", container: "container" };

// node_modules/@electric-sql/pglite/dist/chunk-HWTMPVRX.js
init_chunk_BTBUZ646();
function E2(h2) {
  let s3 = h2.e;
  return s3.query = h2.query, s3.params = h2.params, s3.queryOptions = h2.options, s3;
}
u();
u();
var d2;
var p2;
var t;
var y2;
var x3;
var m2;
var O2;
var F3 = class {
  constructor() {
    R(this, t);
    this.serializers = { ...cn };
    this.parsers = { ...ln };
    R(this, d2, false);
    R(this, p2, false);
  }
  async _initArrayTypes({ force: s3 = false } = {}) {
    if (h(this, d2) && !s3)
      return;
    x(this, d2, true);
    let e = await this.query(`
      SELECT b.oid, b.typarray
      FROM pg_catalog.pg_type a
      LEFT JOIN pg_catalog.pg_type b ON b.oid = a.typelem
      WHERE a.typcategory = 'A'
      GROUP BY b.oid, b.typarray
      ORDER BY b.oid
    `);
    for (let r of e.rows)
      this.serializers[r.typarray] = (n2) => Ke(n2, this.serializers[r.oid], r.typarray), this.parsers[r.typarray] = (n2) => yn(n2, this.parsers[r.oid], r.typarray);
  }
  async refreshArrayTypes() {
    await this._initArrayTypes({ force: true });
  }
  async query(s3, e, r) {
    return await this._checkReady(), await this._runExclusiveTransaction(async () => await T(this, t, x3).call(this, s3, e, r));
  }
  async sql(s3, ...e) {
    let { query: r, params: n2 } = g3(s3, ...e);
    return await this.query(r, n2);
  }
  async exec(s3, e) {
    return await this._checkReady(), await this._runExclusiveTransaction(async () => await T(this, t, m2).call(this, s3, e));
  }
  async describeQuery(s3, e) {
    try {
      await T(this, t, y2).call(this, O.parse({ text: s3, types: e?.paramTypes }), e);
      let r = await T(this, t, y2).call(this, O.describe({ type: "S" }), e), n2 = r.messages.find((c2) => c2.name === "parameterDescription"), i3 = r.messages.find((c2) => c2.name === "rowDescription"), o3 = n2?.dataTypeIDs.map((c2) => ({ dataTypeID: c2, serializer: this.serializers[c2] })) ?? [], u2 = i3?.fields.map((c2) => ({ name: c2.name, dataTypeID: c2.dataTypeID, parser: this.parsers[c2.dataTypeID] })) ?? [];
      return { queryParams: o3, resultFields: u2 };
    } catch (r) {
      throw r instanceof E ? E2({ e: r, options: e, params: undefined, query: s3 }) : r;
    } finally {
      await T(this, t, y2).call(this, O.sync(), e);
    }
  }
  async transaction(s3) {
    return await this._checkReady(), await this._runExclusiveTransaction(async () => {
      await T(this, t, m2).call(this, "BEGIN"), x(this, p2, true);
      let e = false, r = () => {
        if (e)
          throw new Error("Transaction is closed");
      }, n2 = { query: async (i3, o3, u2) => (r(), await T(this, t, x3).call(this, i3, o3, u2)), sql: async (i3, ...o3) => {
        let { query: u2, params: c2 } = g3(i3, ...o3);
        return await T(this, t, x3).call(this, u2, c2);
      }, exec: async (i3, o3) => (r(), await T(this, t, m2).call(this, i3, o3)), rollback: async () => {
        r(), await T(this, t, m2).call(this, "ROLLBACK"), e = true;
      }, listen: async (i3, o3) => (r(), await this.listen(i3, o3, n2)), get closed() {
        return e;
      } };
      try {
        let i3 = await s3(n2);
        return e || (e = true, await T(this, t, m2).call(this, "COMMIT")), x(this, p2, false), i3;
      } catch (i3) {
        throw e || await T(this, t, m2).call(this, "ROLLBACK"), x(this, p2, false), i3;
      }
    });
  }
  async runExclusive(s3) {
    return await this._runExclusiveQuery(s3);
  }
};
d2 = new WeakMap, p2 = new WeakMap, t = new WeakSet, y2 = async function(s3, e = {}) {
  return await this.execProtocol(s3, { ...e, syncToFs: false });
}, x3 = async function(s3, e = [], r) {
  return await this._runExclusiveQuery(async () => {
    T(this, t, O2).call(this, "runQuery", s3, e, r), await this._handleBlob(r?.blob);
    let n2;
    try {
      let { messages: o3 } = await T(this, t, y2).call(this, O.parse({ text: s3, types: r?.paramTypes }), r), u2 = De((await T(this, t, y2).call(this, O.describe({ type: "S" }), r)).messages), c2 = e.map((g4, S2) => {
        let D3 = u2[S2];
        if (g4 == null)
          return null;
        let Q2 = r?.serializers?.[D3] ?? this.serializers[D3];
        return Q2 ? Q2(g4) : g4.toString();
      });
      n2 = [...o3, ...(await T(this, t, y2).call(this, O.bind({ values: c2 }), r)).messages, ...(await T(this, t, y2).call(this, O.describe({ type: "P" }), r)).messages, ...(await T(this, t, y2).call(this, O.execute({}), r)).messages];
    } catch (o3) {
      throw o3 instanceof E ? E2({ e: o3, options: r, params: e, query: s3 }) : o3;
    } finally {
      await T(this, t, y2).call(this, O.sync(), r);
    }
    await this._cleanupBlob(), h(this, p2) || await this.syncToFs();
    let i3 = await this._getWrittenBlob();
    return bn(n2, this.parsers, r, i3)[0];
  });
}, m2 = async function(s3, e) {
  return await this._runExclusiveQuery(async () => {
    T(this, t, O2).call(this, "runExec", s3, e), await this._handleBlob(e?.blob);
    let r;
    try {
      r = (await T(this, t, y2).call(this, O.query(s3), e)).messages;
    } catch (i3) {
      throw i3 instanceof E ? E2({ e: i3, options: e, params: undefined, query: s3 }) : i3;
    } finally {
      await T(this, t, y2).call(this, O.sync(), e);
    }
    this._cleanupBlob(), h(this, p2) || await this.syncToFs();
    let n2 = await this._getWrittenBlob();
    return bn(r, this.parsers, e, n2);
  });
}, O2 = function(...s3) {
  this.debug > 0 && console.log(...s3);
};

// node_modules/@electric-sql/pglite/dist/index.js
init_chunk_VV2EXAN2();
init_chunk_BTBUZ646();
async function xe2(e) {
  if (Fe) {
    let t2 = await import("fs"), r = await import("zlib"), { Writable: a2 } = await import("stream"), { pipeline: o4 } = await import("stream/promises");
    if (!t2.existsSync(e))
      throw new Error(`Extension bundle not found: ${e}`);
    let s4 = r.createGunzip(), l3 = [];
    return await o4(t2.createReadStream(e), s4, new a2({ write(_3, n3, m5) {
      l3.push(_3), m5();
    } })), new Blob(l3);
  } else {
    let t2 = await fetch(e.toString());
    if (!t2.ok || !t2.body)
      return null;
    if (t2.headers.get("Content-Encoding") === "gzip")
      return t2.blob();
    {
      let r = new DecompressionStream("gzip");
      return new Response(t2.body.pipeThrough(r)).blob();
    }
  }
}
async function ke2(e, t2) {
  for (let r in e.pg_extensions) {
    let a2;
    try {
      a2 = await e.pg_extensions[r];
    } catch (o4) {
      console.error("Failed to fetch extension:", r, o4);
      continue;
    }
    if (a2) {
      let o4 = new Uint8Array(await a2.arrayBuffer());
      Qe2(e, r, o4, t2);
    } else
      console.error("Could not get binary data for extension:", r);
  }
}
function Qe2(e, t2, r, a2) {
  Pe2.default.untar(r).forEach((s4) => {
    if (!s4.name.startsWith(".")) {
      let l3 = e.WASM_PREFIX + "/" + s4.name;
      if (s4.name.endsWith(".so")) {
        let _3 = (...m5) => {
          a2("pgfs:ext OK", l3, m5);
        }, n3 = (...m5) => {
          a2("pgfs:ext FAIL", l3, m5);
        };
        e.FS.createPreloadedFile($e2(l3), s4.name.split("/").pop().slice(0, -3), s4.data, true, true, _3, n3, false);
      } else
        e.FS.writeFile(l3, s4.data);
    }
  });
}
function $e2(e) {
  let t2 = e.lastIndexOf("/");
  return t2 > 0 ? e.slice(0, t2) : e;
}
function Ae2(e) {
  let t2;
  if (e?.startsWith("file://")) {
    if (e = e.slice(7), !e)
      throw new Error("Invalid dataDir, must be a valid path");
    t2 = "nodefs";
  } else
    e?.startsWith("idb://") ? (e = e.slice(6), t2 = "idbfs") : e?.startsWith("opfs-ahp://") ? (e = e.slice(11), t2 = "opfs-ahp") : !e || e?.startsWith("memory://") ? t2 = "memoryfs" : t2 = "nodefs";
  return { dataDir: e, fsType: t2 };
}
async function Te2(e, t2) {
  let r;
  if (e && t2 === "nodefs") {
    let { NodeFS: a2 } = await Promise.resolve().then(() => (init_nodefs(), exports_nodefs));
    r = new a2(e);
  } else if (e && t2 === "idbfs")
    r = new ee2(e);
  else if (e && t2 === "opfs-ahp") {
    let { OpfsAhpFS: a2 } = await Promise.resolve().then(() => (init_opfs_ahp(), exports_opfs_ahp));
    r = new a2(e);
  } else
    r = new te2;
  return r;
}
u();
u();
u();
var et2 = new Error("timeout while waiting for mutex to become available");
var tt2 = new Error("mutex already locked");
var Ke2 = new Error("request for lock canceled");
var Ye2 = function(e, t2, r, a2) {
  function o4(s4) {
    return s4 instanceof r ? s4 : new r(function(l3) {
      l3(s4);
    });
  }
  return new (r || (r = Promise))(function(s4, l3) {
    function _3(p4) {
      try {
        m5(a2.next(p4));
      } catch (d3) {
        l3(d3);
      }
    }
    function n3(p4) {
      try {
        m5(a2.throw(p4));
      } catch (d3) {
        l3(d3);
      }
    }
    function m5(p4) {
      p4.done ? s4(p4.value) : o4(p4.value).then(_3, n3);
    }
    m5((a2 = a2.apply(e, t2 || [])).next());
  });
};
var fe2 = class {
  constructor(t2, r = Ke2) {
    this._value = t2, this._cancelError = r, this._weightedQueues = [], this._weightedWaiters = [];
  }
  acquire(t2 = 1) {
    if (t2 <= 0)
      throw new Error(`invalid weight ${t2}: must be positive`);
    return new Promise((r, a2) => {
      this._weightedQueues[t2 - 1] || (this._weightedQueues[t2 - 1] = []), this._weightedQueues[t2 - 1].push({ resolve: r, reject: a2 }), this._dispatch();
    });
  }
  runExclusive(t2, r = 1) {
    return Ye2(this, undefined, undefined, function* () {
      let [a2, o4] = yield this.acquire(r);
      try {
        return yield t2(a2);
      } finally {
        o4();
      }
    });
  }
  waitForUnlock(t2 = 1) {
    if (t2 <= 0)
      throw new Error(`invalid weight ${t2}: must be positive`);
    return new Promise((r) => {
      this._weightedWaiters[t2 - 1] || (this._weightedWaiters[t2 - 1] = []), this._weightedWaiters[t2 - 1].push(r), this._dispatch();
    });
  }
  isLocked() {
    return this._value <= 0;
  }
  getValue() {
    return this._value;
  }
  setValue(t2) {
    this._value = t2, this._dispatch();
  }
  release(t2 = 1) {
    if (t2 <= 0)
      throw new Error(`invalid weight ${t2}: must be positive`);
    this._value += t2, this._dispatch();
  }
  cancel() {
    this._weightedQueues.forEach((t2) => t2.forEach((r) => r.reject(this._cancelError))), this._weightedQueues = [];
  }
  _dispatch() {
    var t2;
    for (let r = this._value;r > 0; r--) {
      let a2 = (t2 = this._weightedQueues[r - 1]) === null || t2 === undefined ? undefined : t2.shift();
      if (!a2)
        continue;
      let o4 = this._value, s4 = r;
      this._value -= r, r = this._value + 1, a2.resolve([o4, this._newReleaser(s4)]);
    }
    this._drainUnlockWaiters();
  }
  _newReleaser(t2) {
    let r = false;
    return () => {
      r || (r = true, this.release(t2));
    };
  }
  _drainUnlockWaiters() {
    for (let t2 = this._value;t2 > 0; t2--)
      this._weightedWaiters[t2 - 1] && (this._weightedWaiters[t2 - 1].forEach((r) => r()), this._weightedWaiters[t2 - 1] = []);
  }
};
var Je2 = function(e, t2, r, a2) {
  function o4(s4) {
    return s4 instanceof r ? s4 : new r(function(l3) {
      l3(s4);
    });
  }
  return new (r || (r = Promise))(function(s4, l3) {
    function _3(p4) {
      try {
        m5(a2.next(p4));
      } catch (d3) {
        l3(d3);
      }
    }
    function n3(p4) {
      try {
        m5(a2.throw(p4));
      } catch (d3) {
        l3(d3);
      }
    }
    function m5(p4) {
      p4.done ? s4(p4.value) : o4(p4.value).then(_3, n3);
    }
    m5((a2 = a2.apply(e, t2 || [])).next());
  });
};
var X2 = class {
  constructor(t2) {
    this._semaphore = new fe2(1, t2);
  }
  acquire() {
    return Je2(this, undefined, undefined, function* () {
      let [, t2] = yield this._semaphore.acquire();
      return t2;
    });
  }
  runExclusive(t2) {
    return this._semaphore.runExclusive(() => t2());
  }
  isLocked() {
    return this._semaphore.isLocked();
  }
  waitForUnlock() {
    return this._semaphore.waitForUnlock();
  }
  release() {
    this._semaphore.isLocked() && this._semaphore.release();
  }
  cancel() {
    return this._semaphore.cancel();
  }
};
u();
var Pe2 = L(or(), 1);
u();
u();
var ee2 = class extends ur {
  async init(t2, r) {
    return this.pg = t2, { emscriptenOpts: { ...r, preRun: [...r.preRun || [], (o4) => {
      let s4 = o4.FS.filesystems.IDBFS;
      o4.FS.mkdir("/pglite"), o4.FS.mkdir(`/pglite/${this.dataDir}`), o4.FS.mount(s4, {}, `/pglite/${this.dataDir}`), o4.FS.symlink(`/pglite/${this.dataDir}`, C2);
    }] } };
  }
  initialSyncFs() {
    return new Promise((t2, r) => {
      this.pg.Module.FS.syncfs(true, (a2) => {
        a2 ? r(a2) : t2();
      });
    });
  }
  syncToFs(t2) {
    return new Promise((r, a2) => {
      this.pg.Module.FS.syncfs(false, (o4) => {
        o4 ? a2(o4) : r();
      });
    });
  }
  async closeFs() {
    let t2 = this.pg.Module.FS.filesystems.IDBFS.dbs[this.dataDir];
    t2 && t2.close(), this.pg.Module.FS.quit();
  }
};
u();
var te2 = class extends ur {
  async closeFs() {
    this.pg.Module.FS.quit();
  }
};
u();
u();
var Ze2 = (() => {
  var _scriptName = import.meta.url;
  return async function(moduleArg = {}) {
    var moduleRtn, Module = moduleArg, readyPromiseResolve, readyPromiseReject, readyPromise = new Promise((e, t2) => {
      readyPromiseResolve = e, readyPromiseReject = t2;
    }), ENVIRONMENT_IS_WEB = typeof window == "object", ENVIRONMENT_IS_WORKER = typeof WorkerGlobalScope < "u", ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string" && process.type != "renderer";
    if (ENVIRONMENT_IS_NODE) {
      let { createRequire: e } = await import("module"), t2 = import.meta.url;
      t2.startsWith("data:") && (t2 = "/");
      var require = e(t2);
    }
    Module.expectedDataFileDownloads ?? (Module.expectedDataFileDownloads = 0), Module.expectedDataFileDownloads++, (() => {
      var e = typeof ENVIRONMENT_IS_PTHREAD < "u" && ENVIRONMENT_IS_PTHREAD, t2 = typeof ENVIRONMENT_IS_WASM_WORKER < "u" && ENVIRONMENT_IS_WASM_WORKER;
      if (e || t2)
        return;
      var r = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";
      function a2(o4) {
        var s4 = "";
        typeof window == "object" ? s4 = window.encodeURIComponent(window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/")) + "/") : typeof process > "u" && typeof location < "u" && (s4 = encodeURIComponent(location.pathname.substring(0, location.pathname.lastIndexOf("/")) + "/"));
        var l3 = "/tmp/sdk/dist/pglite-web/pglite.data", _3 = "pglite.data", n3 = Module.locateFile ? Module.locateFile(_3, "") : _3, m5 = o4.remote_package_size;
        function p4(c2, w4, v3, S3) {
          if (r) {
            require("fs").readFile(c2, (x6, y4) => {
              x6 ? S3(x6) : v3(y4.buffer);
            });
            return;
          }
          Module.dataFileDownloads ?? (Module.dataFileDownloads = {}), fetch(c2).catch((x6) => Promise.reject(new Error(`Network Error: ${c2}`, { cause: x6 }))).then((x6) => {
            if (!x6.ok)
              return Promise.reject(new Error(`${x6.status}: ${x6.url}`));
            if (!x6.body && x6.arrayBuffer)
              return x6.arrayBuffer().then(v3);
            let y4 = x6.body.getReader(), M3 = () => y4.read().then(W3).catch((D4) => Promise.reject(new Error(`Unexpected error while handling : ${x6.url} ${D4}`, { cause: D4 }))), E3 = [], b3 = x6.headers, U3 = Number(b3.get("Content-Length") ?? w4), z2 = 0, W3 = ({ done: D4, value: N2 }) => {
              if (D4) {
                let P4 = new Uint8Array(E3.map((k2) => k2.length).reduce((k2, Le2) => k2 + Le2, 0)), R3 = 0;
                for (let k2 of E3)
                  P4.set(k2, R3), R3 += k2.length;
                v3(P4.buffer);
              } else {
                E3.push(N2), z2 += N2.length, Module.dataFileDownloads[c2] = { loaded: z2, total: U3 };
                let P4 = 0, R3 = 0;
                for (let k2 of Object.values(Module.dataFileDownloads))
                  P4 += k2.loaded, R3 += k2.total;
                return Module.setStatus?.(`Downloading data... (${P4}/${R3})`), M3();
              }
            };
            return Module.setStatus?.("Downloading data..."), M3();
          });
        }
        function d3(c2) {
          console.error("package error:", c2);
        }
        var g5 = null, u2 = Module.getPreloadedPackage ? Module.getPreloadedPackage(n3, m5) : null;
        u2 || p4(n3, m5, (c2) => {
          g5 ? (g5(c2), g5 = null) : u2 = c2;
        }, d3);
        function f3(c2) {
          function w4(M3, E3) {
            if (!M3)
              throw E3 + new Error().stack;
          }
          c2.FS_createPath("/", "home", true, true), c2.FS_createPath("/home", "web_user", true, true), c2.FS_createPath("/", "tmp", true, true), c2.FS_createPath("/tmp", "pglite", true, true), c2.FS_createPath("/tmp/pglite", "bin", true, true), c2.FS_createPath("/tmp/pglite", "lib", true, true), c2.FS_createPath("/tmp/pglite/lib", "postgresql", true, true), c2.FS_createPath("/tmp/pglite/lib/postgresql", "pgxs", true, true), c2.FS_createPath("/tmp/pglite/lib/postgresql/pgxs", "config", true, true), c2.FS_createPath("/tmp/pglite/lib/postgresql/pgxs", "src", true, true), c2.FS_createPath("/tmp/pglite/lib/postgresql/pgxs/src", "makefiles", true, true), c2.FS_createPath("/tmp/pglite", "share", true, true), c2.FS_createPath("/tmp/pglite/share", "postgresql", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql", "extension", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql", "timezone", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Africa", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone", "America", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone/America", "Argentina", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone/America", "Indiana", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone/America", "Kentucky", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone/America", "North_Dakota", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Antarctica", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Arctic", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Asia", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Atlantic", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Australia", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Brazil", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Canada", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Chile", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Etc", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Europe", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Indian", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Mexico", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone", "Pacific", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql/timezone", "US", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql", "timezonesets", true, true), c2.FS_createPath("/tmp/pglite/share/postgresql", "tsearch_data", true, true);
          function v3(M3, E3, b3) {
            this.start = M3, this.end = E3, this.audio = b3;
          }
          v3.prototype = { requests: {}, open: function(M3, E3) {
            this.name = E3, this.requests[E3] = this, c2.addRunDependency(`fp ${this.name}`);
          }, send: function() {
          }, onload: function() {
            var M3 = this.byteArray.subarray(this.start, this.end);
            this.finish(M3);
          }, finish: function(M3) {
            var E3 = this;
            c2.FS_createDataFile(this.name, null, M3, true, true, true), c2.removeRunDependency(`fp ${E3.name}`), this.requests[this.name] = null;
          } };
          for (var S3 = o4.files, x6 = 0;x6 < S3.length; ++x6)
            new v3(S3[x6].start, S3[x6].end, S3[x6].audio || 0).open("GET", S3[x6].filename);
          function y4(M3) {
            w4(M3, "Loading data file failed."), w4(M3.constructor.name === ArrayBuffer.name, "bad input to processPackageData");
            var E3 = new Uint8Array(M3);
            v3.prototype.byteArray = E3;
            for (var b3 = o4.files, U3 = 0;U3 < b3.length; ++U3)
              v3.prototype.requests[b3[U3].filename].onload();
            c2.removeRunDependency("datafile_/tmp/sdk/dist/pglite-web/pglite.data");
          }
          c2.addRunDependency("datafile_/tmp/sdk/dist/pglite-web/pglite.data"), c2.preloadResults ?? (c2.preloadResults = {}), c2.preloadResults[l3] = { fromCache: false }, u2 ? (y4(u2), u2 = null) : g5 = y4;
        }
        Module.calledRun ? f3(Module) : (Module.preRun ?? (Module.preRun = [])).push(f3);
      }
      a2({ files: [{ filename: "/home/web_user/.pgpass", start: 0, end: 204 }, { filename: "/tmp/pglite/bin/initdb", start: 204, end: 204 }, { filename: "/tmp/pglite/bin/postgres", start: 204, end: 204 }, { filename: "/tmp/pglite/lib/postgresql/cyrillic_and_mic.so", start: 204, end: 4698 }, { filename: "/tmp/pglite/lib/postgresql/dict_snowball.so", start: 4698, end: 577992 }, { filename: "/tmp/pglite/lib/postgresql/euc2004_sjis2004.so", start: 577992, end: 580075 }, { filename: "/tmp/pglite/lib/postgresql/euc_cn_and_mic.so", start: 580075, end: 581016 }, { filename: "/tmp/pglite/lib/postgresql/euc_jp_and_sjis.so", start: 581016, end: 588301 }, { filename: "/tmp/pglite/lib/postgresql/euc_kr_and_mic.so", start: 588301, end: 589252 }, { filename: "/tmp/pglite/lib/postgresql/euc_tw_and_big5.so", start: 589252, end: 593830 }, { filename: "/tmp/pglite/lib/postgresql/latin2_and_win1250.so", start: 593830, end: 595236 }, { filename: "/tmp/pglite/lib/postgresql/latin_and_mic.so", start: 595236, end: 596257 }, { filename: "/tmp/pglite/lib/postgresql/libpqwalreceiver.so", start: 596257, end: 716720 }, { filename: "/tmp/pglite/lib/postgresql/pgoutput.so", start: 716720, end: 730234 }, { filename: "/tmp/pglite/lib/postgresql/pgxs/config/install-sh", start: 730234, end: 744231 }, { filename: "/tmp/pglite/lib/postgresql/pgxs/config/missing", start: 744231, end: 745579 }, { filename: "/tmp/pglite/lib/postgresql/pgxs/src/Makefile.global", start: 745579, end: 781844 }, { filename: "/tmp/pglite/lib/postgresql/pgxs/src/Makefile.port", start: 781844, end: 782396 }, { filename: "/tmp/pglite/lib/postgresql/pgxs/src/Makefile.shlib", start: 782396, end: 797698 }, { filename: "/tmp/pglite/lib/postgresql/pgxs/src/makefiles/pgxs.mk", start: 797698, end: 812609 }, { filename: "/tmp/pglite/lib/postgresql/pgxs/src/nls-global.mk", start: 812609, end: 819477 }, { filename: "/tmp/pglite/lib/postgresql/plpgsql.so", start: 819477, end: 971490 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_big5.so", start: 971490, end: 1086238 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_cyrillic.so", start: 1086238, end: 1092212 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_euc2004.so", start: 1092212, end: 1297144 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_euc_cn.so", start: 1297144, end: 1372324 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_euc_jp.so", start: 1372324, end: 1523552 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_euc_kr.so", start: 1523552, end: 1626408 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_euc_tw.so", start: 1626408, end: 1825964 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_gb18030.so", start: 1825964, end: 2088341 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_gbk.so", start: 2088341, end: 2234873 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_iso8859.so", start: 2234873, end: 2258544 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_iso8859_1.so", start: 2258544, end: 2259516 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_johab.so", start: 2259516, end: 2421220 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_sjis.so", start: 2421220, end: 2502880 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_sjis2004.so", start: 2502880, end: 2629512 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_uhc.so", start: 2629512, end: 2796784 }, { filename: "/tmp/pglite/lib/postgresql/utf8_and_win.so", start: 2796784, end: 2823383 }, { filename: "/tmp/pglite/password", start: 2823383, end: 2823392 }, { filename: "/tmp/pglite/share/postgresql/errcodes.txt", start: 2823392, end: 2856784 }, { filename: "/tmp/pglite/share/postgresql/extension/plpgsql--1.0.sql", start: 2856784, end: 2857442 }, { filename: "/tmp/pglite/share/postgresql/extension/plpgsql.control", start: 2857442, end: 2857635 }, { filename: "/tmp/pglite/share/postgresql/information_schema.sql", start: 2857635, end: 2973158 }, { filename: "/tmp/pglite/share/postgresql/pg_hba.conf.sample", start: 2973158, end: 2978783 }, { filename: "/tmp/pglite/share/postgresql/pg_ident.conf.sample", start: 2978783, end: 2981423 }, { filename: "/tmp/pglite/share/postgresql/pg_service.conf.sample", start: 2981423, end: 2982027 }, { filename: "/tmp/pglite/share/postgresql/postgres.bki", start: 2982027, end: 3935295 }, { filename: "/tmp/pglite/share/postgresql/postgresql.conf.sample", start: 3935295, end: 3965957 }, { filename: "/tmp/pglite/share/postgresql/psqlrc.sample", start: 3965957, end: 3966235 }, { filename: "/tmp/pglite/share/postgresql/snowball_create.sql", start: 3966235, end: 4010411 }, { filename: "/tmp/pglite/share/postgresql/sql_features.txt", start: 4010411, end: 4046144 }, { filename: "/tmp/pglite/share/postgresql/system_constraints.sql", start: 4046144, end: 4055039 }, { filename: "/tmp/pglite/share/postgresql/system_functions.sql", start: 4055039, end: 4079342 }, { filename: "/tmp/pglite/share/postgresql/system_views.sql", start: 4079342, end: 4131036 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Abidjan", start: 4131036, end: 4131184 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Accra", start: 4131184, end: 4131332 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Addis_Ababa", start: 4131332, end: 4131597 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Algiers", start: 4131597, end: 4132332 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Asmara", start: 4132332, end: 4132597 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Asmera", start: 4132597, end: 4132862 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Bamako", start: 4132862, end: 4133010 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Bangui", start: 4133010, end: 4133245 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Banjul", start: 4133245, end: 4133393 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Bissau", start: 4133393, end: 4133587 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Blantyre", start: 4133587, end: 4133736 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Brazzaville", start: 4133736, end: 4133971 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Bujumbura", start: 4133971, end: 4134120 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Cairo", start: 4134120, end: 4136519 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Casablanca", start: 4136519, end: 4138948 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Ceuta", start: 4138948, end: 4141000 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Conakry", start: 4141000, end: 4141148 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Dakar", start: 4141148, end: 4141296 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Dar_es_Salaam", start: 4141296, end: 4141561 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Djibouti", start: 4141561, end: 4141826 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Douala", start: 4141826, end: 4142061 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/El_Aaiun", start: 4142061, end: 4144356 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Freetown", start: 4144356, end: 4144504 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Gaborone", start: 4144504, end: 4144653 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Harare", start: 4144653, end: 4144802 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Johannesburg", start: 4144802, end: 4145048 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Juba", start: 4145048, end: 4145727 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Kampala", start: 4145727, end: 4145992 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Khartoum", start: 4145992, end: 4146671 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Kigali", start: 4146671, end: 4146820 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Kinshasa", start: 4146820, end: 4147055 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Lagos", start: 4147055, end: 4147290 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Libreville", start: 4147290, end: 4147525 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Lome", start: 4147525, end: 4147673 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Luanda", start: 4147673, end: 4147908 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Lubumbashi", start: 4147908, end: 4148057 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Lusaka", start: 4148057, end: 4148206 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Malabo", start: 4148206, end: 4148441 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Maputo", start: 4148441, end: 4148590 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Maseru", start: 4148590, end: 4148836 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Mbabane", start: 4148836, end: 4149082 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Mogadishu", start: 4149082, end: 4149347 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Monrovia", start: 4149347, end: 4149555 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Nairobi", start: 4149555, end: 4149820 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Ndjamena", start: 4149820, end: 4150019 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Niamey", start: 4150019, end: 4150254 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Nouakchott", start: 4150254, end: 4150402 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Ouagadougou", start: 4150402, end: 4150550 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Porto-Novo", start: 4150550, end: 4150785 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Sao_Tome", start: 4150785, end: 4151039 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Timbuktu", start: 4151039, end: 4151187 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Tripoli", start: 4151187, end: 4151812 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Tunis", start: 4151812, end: 4152501 }, { filename: "/tmp/pglite/share/postgresql/timezone/Africa/Windhoek", start: 4152501, end: 4153456 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Adak", start: 4153456, end: 4155812 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Anchorage", start: 4155812, end: 4158183 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Anguilla", start: 4158183, end: 4158429 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Antigua", start: 4158429, end: 4158675 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Araguaina", start: 4158675, end: 4159559 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/Buenos_Aires", start: 4159559, end: 4160635 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/Catamarca", start: 4160635, end: 4161711 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/ComodRivadavia", start: 4161711, end: 4162787 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/Cordoba", start: 4162787, end: 4163863 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/Jujuy", start: 4163863, end: 4164911 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/La_Rioja", start: 4164911, end: 4166001 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/Mendoza", start: 4166001, end: 4167077 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/Rio_Gallegos", start: 4167077, end: 4168153 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/Salta", start: 4168153, end: 4169201 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/San_Juan", start: 4169201, end: 4170291 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/San_Luis", start: 4170291, end: 4171393 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/Tucuman", start: 4171393, end: 4172497 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Argentina/Ushuaia", start: 4172497, end: 4173573 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Aruba", start: 4173573, end: 4173819 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Asuncion", start: 4173819, end: 4175477 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Atikokan", start: 4175477, end: 4175659 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Atka", start: 4175659, end: 4178015 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Bahia", start: 4178015, end: 4179039 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Bahia_Banderas", start: 4179039, end: 4180139 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Barbados", start: 4180139, end: 4180575 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Belem", start: 4180575, end: 4181151 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Belize", start: 4181151, end: 4182765 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Blanc-Sablon", start: 4182765, end: 4183011 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Boa_Vista", start: 4183011, end: 4183643 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Bogota", start: 4183643, end: 4183889 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Boise", start: 4183889, end: 4186299 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Buenos_Aires", start: 4186299, end: 4187375 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Cambridge_Bay", start: 4187375, end: 4189629 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Campo_Grande", start: 4189629, end: 4191073 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Cancun", start: 4191073, end: 4191937 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Caracas", start: 4191937, end: 4192201 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Catamarca", start: 4192201, end: 4193277 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Cayenne", start: 4193277, end: 4193475 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Cayman", start: 4193475, end: 4193657 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Chicago", start: 4193657, end: 4197249 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Chihuahua", start: 4197249, end: 4198351 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Ciudad_Juarez", start: 4198351, end: 4199889 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Coral_Harbour", start: 4199889, end: 4200071 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Cordoba", start: 4200071, end: 4201147 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Costa_Rica", start: 4201147, end: 4201463 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Coyhaique", start: 4201463, end: 4203603 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Creston", start: 4203603, end: 4203963 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Cuiaba", start: 4203963, end: 4205379 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Curacao", start: 4205379, end: 4205625 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Danmarkshavn", start: 4205625, end: 4206323 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Dawson", start: 4206323, end: 4207937 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Dawson_Creek", start: 4207937, end: 4208987 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Denver", start: 4208987, end: 4211447 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Detroit", start: 4211447, end: 4213677 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Dominica", start: 4213677, end: 4213923 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Edmonton", start: 4213923, end: 4216255 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Eirunepe", start: 4216255, end: 4216911 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/El_Salvador", start: 4216911, end: 4217135 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Ensenada", start: 4217135, end: 4219593 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Fort_Nelson", start: 4219593, end: 4221833 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Fort_Wayne", start: 4221833, end: 4223515 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Fortaleza", start: 4223515, end: 4224231 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Glace_Bay", start: 4224231, end: 4226423 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Godthab", start: 4226423, end: 4228326 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Goose_Bay", start: 4228326, end: 4231536 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Grand_Turk", start: 4231536, end: 4233370 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Grenada", start: 4233370, end: 4233616 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Guadeloupe", start: 4233616, end: 4233862 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Guatemala", start: 4233862, end: 4234142 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Guayaquil", start: 4234142, end: 4234388 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Guyana", start: 4234388, end: 4234650 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Halifax", start: 4234650, end: 4238074 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Havana", start: 4238074, end: 4240490 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Hermosillo", start: 4240490, end: 4240878 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Indiana/Indianapolis", start: 4240878, end: 4242560 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Indiana/Knox", start: 4242560, end: 4245004 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Indiana/Marengo", start: 4245004, end: 4246742 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Indiana/Petersburg", start: 4246742, end: 4248662 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Indiana/Tell_City", start: 4248662, end: 4250362 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Indiana/Vevay", start: 4250362, end: 4251792 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Indiana/Vincennes", start: 4251792, end: 4253502 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Indiana/Winamac", start: 4253502, end: 4255296 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Indianapolis", start: 4255296, end: 4256978 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Inuvik", start: 4256978, end: 4259052 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Iqaluit", start: 4259052, end: 4261254 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Jamaica", start: 4261254, end: 4261736 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Jujuy", start: 4261736, end: 4262784 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Juneau", start: 4262784, end: 4265137 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Kentucky/Louisville", start: 4265137, end: 4267925 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Kentucky/Monticello", start: 4267925, end: 4270293 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Knox_IN", start: 4270293, end: 4272737 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Kralendijk", start: 4272737, end: 4272983 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/La_Paz", start: 4272983, end: 4273215 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Lima", start: 4273215, end: 4273621 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Los_Angeles", start: 4273621, end: 4276473 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Louisville", start: 4276473, end: 4279261 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Lower_Princes", start: 4279261, end: 4279507 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Maceio", start: 4279507, end: 4280251 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Managua", start: 4280251, end: 4280681 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Manaus", start: 4280681, end: 4281285 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Marigot", start: 4281285, end: 4281531 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Martinique", start: 4281531, end: 4281763 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Matamoros", start: 4281763, end: 4283181 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Mazatlan", start: 4283181, end: 4284241 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Mendoza", start: 4284241, end: 4285317 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Menominee", start: 4285317, end: 4287591 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Merida", start: 4287591, end: 4288595 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Metlakatla", start: 4288595, end: 4290018 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Mexico_City", start: 4290018, end: 4291240 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Miquelon", start: 4291240, end: 4292906 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Moncton", start: 4292906, end: 4296060 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Monterrey", start: 4296060, end: 4297174 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Montevideo", start: 4297174, end: 4298684 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Montreal", start: 4298684, end: 4302178 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Montserrat", start: 4302178, end: 4302424 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Nassau", start: 4302424, end: 4305918 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/New_York", start: 4305918, end: 4309470 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Nipigon", start: 4309470, end: 4312964 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Nome", start: 4312964, end: 4315331 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Noronha", start: 4315331, end: 4316047 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/North_Dakota/Beulah", start: 4316047, end: 4318443 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/North_Dakota/Center", start: 4318443, end: 4320839 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/North_Dakota/New_Salem", start: 4320839, end: 4323235 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Nuuk", start: 4323235, end: 4325138 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Ojinaga", start: 4325138, end: 4326662 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Panama", start: 4326662, end: 4326844 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Pangnirtung", start: 4326844, end: 4329046 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Paramaribo", start: 4329046, end: 4329308 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Phoenix", start: 4329308, end: 4329668 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Port-au-Prince", start: 4329668, end: 4331102 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Port_of_Spain", start: 4331102, end: 4331348 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Porto_Acre", start: 4331348, end: 4331976 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Porto_Velho", start: 4331976, end: 4332552 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Puerto_Rico", start: 4332552, end: 4332798 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Punta_Arenas", start: 4332798, end: 4334714 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Rainy_River", start: 4334714, end: 4337582 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Rankin_Inlet", start: 4337582, end: 4339648 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Recife", start: 4339648, end: 4340364 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Regina", start: 4340364, end: 4341344 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Resolute", start: 4341344, end: 4343410 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Rio_Branco", start: 4343410, end: 4344038 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Rosario", start: 4344038, end: 4345114 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Santa_Isabel", start: 4345114, end: 4347572 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Santarem", start: 4347572, end: 4348174 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Santiago", start: 4348174, end: 4350703 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Santo_Domingo", start: 4350703, end: 4351161 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Sao_Paulo", start: 4351161, end: 4352605 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Scoresbysund", start: 4352605, end: 4354554 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Shiprock", start: 4354554, end: 4357014 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Sitka", start: 4357014, end: 4359343 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/St_Barthelemy", start: 4359343, end: 4359589 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/St_Johns", start: 4359589, end: 4363244 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/St_Kitts", start: 4363244, end: 4363490 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/St_Lucia", start: 4363490, end: 4363736 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/St_Thomas", start: 4363736, end: 4363982 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/St_Vincent", start: 4363982, end: 4364228 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Swift_Current", start: 4364228, end: 4364788 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Tegucigalpa", start: 4364788, end: 4365040 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Thule", start: 4365040, end: 4366542 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Thunder_Bay", start: 4366542, end: 4370036 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Tijuana", start: 4370036, end: 4372494 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Toronto", start: 4372494, end: 4375988 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Tortola", start: 4375988, end: 4376234 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Vancouver", start: 4376234, end: 4379126 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Virgin", start: 4379126, end: 4379372 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Whitehorse", start: 4379372, end: 4380986 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Winnipeg", start: 4380986, end: 4383854 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Yakutat", start: 4383854, end: 4386159 }, { filename: "/tmp/pglite/share/postgresql/timezone/America/Yellowknife", start: 4386159, end: 4388491 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/Casey", start: 4388491, end: 4388928 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/Davis", start: 4388928, end: 4389225 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/DumontDUrville", start: 4389225, end: 4389411 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/Macquarie", start: 4389411, end: 4391671 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/Mawson", start: 4391671, end: 4391870 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/McMurdo", start: 4391870, end: 4394307 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/Palmer", start: 4394307, end: 4395725 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/Rothera", start: 4395725, end: 4395889 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/South_Pole", start: 4395889, end: 4398326 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/Syowa", start: 4398326, end: 4398491 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/Troll", start: 4398491, end: 4399653 }, { filename: "/tmp/pglite/share/postgresql/timezone/Antarctica/Vostok", start: 4399653, end: 4399880 }, { filename: "/tmp/pglite/share/postgresql/timezone/Arctic/Longyearbyen", start: 4399880, end: 4402178 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Aden", start: 4402178, end: 4402343 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Almaty", start: 4402343, end: 4403340 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Amman", start: 4403340, end: 4404787 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Anadyr", start: 4404787, end: 4405975 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Aqtau", start: 4405975, end: 4406958 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Aqtobe", start: 4406958, end: 4407969 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Ashgabat", start: 4407969, end: 4408588 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Ashkhabad", start: 4408588, end: 4409207 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Atyrau", start: 4409207, end: 4410198 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Baghdad", start: 4410198, end: 4411181 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Bahrain", start: 4411181, end: 4411380 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Baku", start: 4411380, end: 4412607 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Bangkok", start: 4412607, end: 4412806 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Barnaul", start: 4412806, end: 4414027 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Beirut", start: 4414027, end: 4416181 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Bishkek", start: 4416181, end: 4417164 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Brunei", start: 4417164, end: 4417647 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Calcutta", start: 4417647, end: 4417932 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Chita", start: 4417932, end: 4419153 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Choibalsan", start: 4419153, end: 4420044 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Chongqing", start: 4420044, end: 4420605 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Chungking", start: 4420605, end: 4421166 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Colombo", start: 4421166, end: 4421538 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Dacca", start: 4421538, end: 4421875 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Damascus", start: 4421875, end: 4423762 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Dhaka", start: 4423762, end: 4424099 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Dili", start: 4424099, end: 4424370 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Dubai", start: 4424370, end: 4424535 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Dushanbe", start: 4424535, end: 4425126 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Famagusta", start: 4425126, end: 4427154 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Gaza", start: 4427154, end: 4430998 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Harbin", start: 4430998, end: 4431559 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Hebron", start: 4431559, end: 4435431 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Ho_Chi_Minh", start: 4435431, end: 4435782 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Hong_Kong", start: 4435782, end: 4437015 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Hovd", start: 4437015, end: 4437906 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Irkutsk", start: 4437906, end: 4439149 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Istanbul", start: 4439149, end: 4441096 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Jakarta", start: 4441096, end: 4441479 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Jayapura", start: 4441479, end: 4441700 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Jerusalem", start: 4441700, end: 4444088 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Kabul", start: 4444088, end: 4444296 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Kamchatka", start: 4444296, end: 4445462 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Karachi", start: 4445462, end: 4445841 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Kashgar", start: 4445841, end: 4446006 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Kathmandu", start: 4446006, end: 4446218 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Katmandu", start: 4446218, end: 4446430 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Khandyga", start: 4446430, end: 4447701 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Kolkata", start: 4447701, end: 4447986 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Krasnoyarsk", start: 4447986, end: 4449193 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Kuala_Lumpur", start: 4449193, end: 4449608 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Kuching", start: 4449608, end: 4450091 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Kuwait", start: 4450091, end: 4450256 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Macao", start: 4450256, end: 4451483 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Macau", start: 4451483, end: 4452710 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Magadan", start: 4452710, end: 4453932 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Makassar", start: 4453932, end: 4454186 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Manila", start: 4454186, end: 4454608 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Muscat", start: 4454608, end: 4454773 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Nicosia", start: 4454773, end: 4456775 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Novokuznetsk", start: 4456775, end: 4457940 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Novosibirsk", start: 4457940, end: 4459161 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Omsk", start: 4459161, end: 4460368 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Oral", start: 4460368, end: 4461373 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Phnom_Penh", start: 4461373, end: 4461572 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Pontianak", start: 4461572, end: 4461925 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Pyongyang", start: 4461925, end: 4462162 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Qatar", start: 4462162, end: 4462361 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Qostanay", start: 4462361, end: 4463400 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Qyzylorda", start: 4463400, end: 4464425 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Rangoon", start: 4464425, end: 4464693 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Riyadh", start: 4464693, end: 4464858 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Saigon", start: 4464858, end: 4465209 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Sakhalin", start: 4465209, end: 4466411 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Samarkand", start: 4466411, end: 4466988 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Seoul", start: 4466988, end: 4467605 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Shanghai", start: 4467605, end: 4468166 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Singapore", start: 4468166, end: 4468581 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Srednekolymsk", start: 4468581, end: 4469789 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Taipei", start: 4469789, end: 4470550 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Tashkent", start: 4470550, end: 4471141 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Tbilisi", start: 4471141, end: 4472176 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Tehran", start: 4472176, end: 4473438 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Tel_Aviv", start: 4473438, end: 4475826 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Thimbu", start: 4475826, end: 4476029 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Thimphu", start: 4476029, end: 4476232 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Tokyo", start: 4476232, end: 4476541 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Tomsk", start: 4476541, end: 4477762 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Ujung_Pandang", start: 4477762, end: 4478016 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Ulaanbaatar", start: 4478016, end: 4478907 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Ulan_Bator", start: 4478907, end: 4479798 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Urumqi", start: 4479798, end: 4479963 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Ust-Nera", start: 4479963, end: 4481215 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Vientiane", start: 4481215, end: 4481414 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Vladivostok", start: 4481414, end: 4482622 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Yakutsk", start: 4482622, end: 4483829 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Yangon", start: 4483829, end: 4484097 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Yekaterinburg", start: 4484097, end: 4485340 }, { filename: "/tmp/pglite/share/postgresql/timezone/Asia/Yerevan", start: 4485340, end: 4486491 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Azores", start: 4486491, end: 4489947 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Bermuda", start: 4489947, end: 4492343 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Canary", start: 4492343, end: 4494240 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Cape_Verde", start: 4494240, end: 4494510 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Faeroe", start: 4494510, end: 4496325 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Faroe", start: 4496325, end: 4498140 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Jan_Mayen", start: 4498140, end: 4500438 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Madeira", start: 4500438, end: 4503815 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Reykjavik", start: 4503815, end: 4503963 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/South_Georgia", start: 4503963, end: 4504127 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/St_Helena", start: 4504127, end: 4504275 }, { filename: "/tmp/pglite/share/postgresql/timezone/Atlantic/Stanley", start: 4504275, end: 4505489 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/ACT", start: 4505489, end: 4507679 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Adelaide", start: 4507679, end: 4509887 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Brisbane", start: 4509887, end: 4510306 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Broken_Hill", start: 4510306, end: 4512535 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Canberra", start: 4512535, end: 4514725 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Currie", start: 4514725, end: 4517083 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Darwin", start: 4517083, end: 4517408 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Eucla", start: 4517408, end: 4517878 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Hobart", start: 4517878, end: 4520236 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/LHI", start: 4520236, end: 4522096 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Lindeman", start: 4522096, end: 4522571 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Lord_Howe", start: 4522571, end: 4524431 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Melbourne", start: 4524431, end: 4526621 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/NSW", start: 4526621, end: 4528811 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/North", start: 4528811, end: 4529136 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Perth", start: 4529136, end: 4529582 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Queensland", start: 4529582, end: 4530001 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/South", start: 4530001, end: 4532209 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Sydney", start: 4532209, end: 4534399 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Tasmania", start: 4534399, end: 4536757 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Victoria", start: 4536757, end: 4538947 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/West", start: 4538947, end: 4539393 }, { filename: "/tmp/pglite/share/postgresql/timezone/Australia/Yancowinna", start: 4539393, end: 4541622 }, { filename: "/tmp/pglite/share/postgresql/timezone/Brazil/Acre", start: 4541622, end: 4542250 }, { filename: "/tmp/pglite/share/postgresql/timezone/Brazil/DeNoronha", start: 4542250, end: 4542966 }, { filename: "/tmp/pglite/share/postgresql/timezone/Brazil/East", start: 4542966, end: 4544410 }, { filename: "/tmp/pglite/share/postgresql/timezone/Brazil/West", start: 4544410, end: 4545014 }, { filename: "/tmp/pglite/share/postgresql/timezone/CET", start: 4545014, end: 4547947 }, { filename: "/tmp/pglite/share/postgresql/timezone/CST6CDT", start: 4547947, end: 4551539 }, { filename: "/tmp/pglite/share/postgresql/timezone/Canada/Atlantic", start: 4551539, end: 4554963 }, { filename: "/tmp/pglite/share/postgresql/timezone/Canada/Central", start: 4554963, end: 4557831 }, { filename: "/tmp/pglite/share/postgresql/timezone/Canada/Eastern", start: 4557831, end: 4561325 }, { filename: "/tmp/pglite/share/postgresql/timezone/Canada/Mountain", start: 4561325, end: 4563657 }, { filename: "/tmp/pglite/share/postgresql/timezone/Canada/Newfoundland", start: 4563657, end: 4567312 }, { filename: "/tmp/pglite/share/postgresql/timezone/Canada/Pacific", start: 4567312, end: 4570204 }, { filename: "/tmp/pglite/share/postgresql/timezone/Canada/Saskatchewan", start: 4570204, end: 4571184 }, { filename: "/tmp/pglite/share/postgresql/timezone/Canada/Yukon", start: 4571184, end: 4572798 }, { filename: "/tmp/pglite/share/postgresql/timezone/Chile/Continental", start: 4572798, end: 4575327 }, { filename: "/tmp/pglite/share/postgresql/timezone/Chile/EasterIsland", start: 4575327, end: 4577560 }, { filename: "/tmp/pglite/share/postgresql/timezone/Cuba", start: 4577560, end: 4579976 }, { filename: "/tmp/pglite/share/postgresql/timezone/EET", start: 4579976, end: 4582238 }, { filename: "/tmp/pglite/share/postgresql/timezone/EST", start: 4582238, end: 4582420 }, { filename: "/tmp/pglite/share/postgresql/timezone/EST5EDT", start: 4582420, end: 4585972 }, { filename: "/tmp/pglite/share/postgresql/timezone/Egypt", start: 4585972, end: 4588371 }, { filename: "/tmp/pglite/share/postgresql/timezone/Eire", start: 4588371, end: 4591863 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT", start: 4591863, end: 4591977 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+0", start: 4591977, end: 4592091 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+1", start: 4592091, end: 4592207 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+10", start: 4592207, end: 4592324 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+11", start: 4592324, end: 4592441 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+12", start: 4592441, end: 4592558 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+2", start: 4592558, end: 4592674 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+3", start: 4592674, end: 4592790 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+4", start: 4592790, end: 4592906 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+5", start: 4592906, end: 4593022 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+6", start: 4593022, end: 4593138 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+7", start: 4593138, end: 4593254 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+8", start: 4593254, end: 4593370 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT+9", start: 4593370, end: 4593486 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-0", start: 4593486, end: 4593600 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-1", start: 4593600, end: 4593717 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-10", start: 4593717, end: 4593835 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-11", start: 4593835, end: 4593953 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-12", start: 4593953, end: 4594071 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-13", start: 4594071, end: 4594189 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-14", start: 4594189, end: 4594307 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-2", start: 4594307, end: 4594424 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-3", start: 4594424, end: 4594541 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-4", start: 4594541, end: 4594658 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-5", start: 4594658, end: 4594775 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-6", start: 4594775, end: 4594892 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-7", start: 4594892, end: 4595009 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-8", start: 4595009, end: 4595126 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT-9", start: 4595126, end: 4595243 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/GMT0", start: 4595243, end: 4595357 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/Greenwich", start: 4595357, end: 4595471 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/UCT", start: 4595471, end: 4595585 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/UTC", start: 4595585, end: 4595699 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/Universal", start: 4595699, end: 4595813 }, { filename: "/tmp/pglite/share/postgresql/timezone/Etc/Zulu", start: 4595813, end: 4595927 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Amsterdam", start: 4595927, end: 4598860 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Andorra", start: 4598860, end: 4600602 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Astrakhan", start: 4600602, end: 4601767 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Athens", start: 4601767, end: 4604029 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Belfast", start: 4604029, end: 4607693 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Belgrade", start: 4607693, end: 4609613 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Berlin", start: 4609613, end: 4611911 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Bratislava", start: 4611911, end: 4614212 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Brussels", start: 4614212, end: 4617145 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Bucharest", start: 4617145, end: 4619329 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Budapest", start: 4619329, end: 4621697 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Busingen", start: 4621697, end: 4623606 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Chisinau", start: 4623606, end: 4625996 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Copenhagen", start: 4625996, end: 4628294 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Dublin", start: 4628294, end: 4631786 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Gibraltar", start: 4631786, end: 4634854 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Guernsey", start: 4634854, end: 4638518 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Helsinki", start: 4638518, end: 4640418 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Isle_of_Man", start: 4640418, end: 4644082 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Istanbul", start: 4644082, end: 4646029 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Jersey", start: 4646029, end: 4649693 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Kaliningrad", start: 4649693, end: 4651186 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Kiev", start: 4651186, end: 4653306 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Kirov", start: 4653306, end: 4654491 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Kyiv", start: 4654491, end: 4656611 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Lisbon", start: 4656611, end: 4660138 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Ljubljana", start: 4660138, end: 4662058 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/London", start: 4662058, end: 4665722 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Luxembourg", start: 4665722, end: 4668655 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Madrid", start: 4668655, end: 4671269 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Malta", start: 4671269, end: 4673889 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Mariehamn", start: 4673889, end: 4675789 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Minsk", start: 4675789, end: 4677110 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Monaco", start: 4677110, end: 4680072 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Moscow", start: 4680072, end: 4681607 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Nicosia", start: 4681607, end: 4683609 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Oslo", start: 4683609, end: 4685907 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Paris", start: 4685907, end: 4688869 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Podgorica", start: 4688869, end: 4690789 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Prague", start: 4690789, end: 4693090 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Riga", start: 4693090, end: 4695288 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Rome", start: 4695288, end: 4697929 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Samara", start: 4697929, end: 4699144 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/San_Marino", start: 4699144, end: 4701785 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Sarajevo", start: 4701785, end: 4703705 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Saratov", start: 4703705, end: 4704888 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Simferopol", start: 4704888, end: 4706357 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Skopje", start: 4706357, end: 4708277 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Sofia", start: 4708277, end: 4710354 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Stockholm", start: 4710354, end: 4712652 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Tallinn", start: 4712652, end: 4714800 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Tirane", start: 4714800, end: 4716884 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Tiraspol", start: 4716884, end: 4719274 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Ulyanovsk", start: 4719274, end: 4720541 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Uzhgorod", start: 4720541, end: 4722661 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Vaduz", start: 4722661, end: 4724570 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Vatican", start: 4724570, end: 4727211 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Vienna", start: 4727211, end: 4729411 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Vilnius", start: 4729411, end: 4731573 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Volgograd", start: 4731573, end: 4732766 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Warsaw", start: 4732766, end: 4735420 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Zagreb", start: 4735420, end: 4737340 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Zaporozhye", start: 4737340, end: 4739460 }, { filename: "/tmp/pglite/share/postgresql/timezone/Europe/Zurich", start: 4739460, end: 4741369 }, { filename: "/tmp/pglite/share/postgresql/timezone/Factory", start: 4741369, end: 4741485 }, { filename: "/tmp/pglite/share/postgresql/timezone/GB", start: 4741485, end: 4745149 }, { filename: "/tmp/pglite/share/postgresql/timezone/GB-Eire", start: 4745149, end: 4748813 }, { filename: "/tmp/pglite/share/postgresql/timezone/GMT", start: 4748813, end: 4748927 }, { filename: "/tmp/pglite/share/postgresql/timezone/GMT+0", start: 4748927, end: 4749041 }, { filename: "/tmp/pglite/share/postgresql/timezone/GMT-0", start: 4749041, end: 4749155 }, { filename: "/tmp/pglite/share/postgresql/timezone/GMT0", start: 4749155, end: 4749269 }, { filename: "/tmp/pglite/share/postgresql/timezone/Greenwich", start: 4749269, end: 4749383 }, { filename: "/tmp/pglite/share/postgresql/timezone/HST", start: 4749383, end: 4749712 }, { filename: "/tmp/pglite/share/postgresql/timezone/Hongkong", start: 4749712, end: 4750945 }, { filename: "/tmp/pglite/share/postgresql/timezone/Iceland", start: 4750945, end: 4751093 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Antananarivo", start: 4751093, end: 4751358 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Chagos", start: 4751358, end: 4751557 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Christmas", start: 4751557, end: 4751756 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Cocos", start: 4751756, end: 4752024 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Comoro", start: 4752024, end: 4752289 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Kerguelen", start: 4752289, end: 4752488 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Mahe", start: 4752488, end: 4752653 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Maldives", start: 4752653, end: 4752852 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Mauritius", start: 4752852, end: 4753093 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Mayotte", start: 4753093, end: 4753358 }, { filename: "/tmp/pglite/share/postgresql/timezone/Indian/Reunion", start: 4753358, end: 4753523 }, { filename: "/tmp/pglite/share/postgresql/timezone/Iran", start: 4753523, end: 4754785 }, { filename: "/tmp/pglite/share/postgresql/timezone/Israel", start: 4754785, end: 4757173 }, { filename: "/tmp/pglite/share/postgresql/timezone/Jamaica", start: 4757173, end: 4757655 }, { filename: "/tmp/pglite/share/postgresql/timezone/Japan", start: 4757655, end: 4757964 }, { filename: "/tmp/pglite/share/postgresql/timezone/Kwajalein", start: 4757964, end: 4758280 }, { filename: "/tmp/pglite/share/postgresql/timezone/Libya", start: 4758280, end: 4758905 }, { filename: "/tmp/pglite/share/postgresql/timezone/MET", start: 4758905, end: 4761838 }, { filename: "/tmp/pglite/share/postgresql/timezone/MST", start: 4761838, end: 4762198 }, { filename: "/tmp/pglite/share/postgresql/timezone/MST7MDT", start: 4762198, end: 4764658 }, { filename: "/tmp/pglite/share/postgresql/timezone/Mexico/BajaNorte", start: 4764658, end: 4767116 }, { filename: "/tmp/pglite/share/postgresql/timezone/Mexico/BajaSur", start: 4767116, end: 4768176 }, { filename: "/tmp/pglite/share/postgresql/timezone/Mexico/General", start: 4768176, end: 4769398 }, { filename: "/tmp/pglite/share/postgresql/timezone/NZ", start: 4769398, end: 4771835 }, { filename: "/tmp/pglite/share/postgresql/timezone/NZ-CHAT", start: 4771835, end: 4773903 }, { filename: "/tmp/pglite/share/postgresql/timezone/Navajo", start: 4773903, end: 4776363 }, { filename: "/tmp/pglite/share/postgresql/timezone/PRC", start: 4776363, end: 4776924 }, { filename: "/tmp/pglite/share/postgresql/timezone/PST8PDT", start: 4776924, end: 4779776 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Apia", start: 4779776, end: 4780388 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Auckland", start: 4780388, end: 4782825 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Bougainville", start: 4782825, end: 4783093 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Chatham", start: 4783093, end: 4785161 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Chuuk", start: 4785161, end: 4785347 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Easter", start: 4785347, end: 4787580 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Efate", start: 4787580, end: 4788118 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Enderbury", start: 4788118, end: 4788352 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Fakaofo", start: 4788352, end: 4788552 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Fiji", start: 4788552, end: 4789130 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Funafuti", start: 4789130, end: 4789296 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Galapagos", start: 4789296, end: 4789534 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Gambier", start: 4789534, end: 4789698 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Guadalcanal", start: 4789698, end: 4789864 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Guam", start: 4789864, end: 4790358 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Honolulu", start: 4790358, end: 4790687 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Johnston", start: 4790687, end: 4791016 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Kanton", start: 4791016, end: 4791250 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Kiritimati", start: 4791250, end: 4791488 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Kosrae", start: 4791488, end: 4791839 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Kwajalein", start: 4791839, end: 4792155 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Majuro", start: 4792155, end: 4792321 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Marquesas", start: 4792321, end: 4792494 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Midway", start: 4792494, end: 4792669 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Nauru", start: 4792669, end: 4792921 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Niue", start: 4792921, end: 4793124 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Norfolk", start: 4793124, end: 4794004 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Noumea", start: 4794004, end: 4794308 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Pago_Pago", start: 4794308, end: 4794483 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Palau", start: 4794483, end: 4794663 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Pitcairn", start: 4794663, end: 4794865 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Pohnpei", start: 4794865, end: 4795031 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Ponape", start: 4795031, end: 4795197 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Port_Moresby", start: 4795197, end: 4795383 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Rarotonga", start: 4795383, end: 4795986 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Saipan", start: 4795986, end: 4796480 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Samoa", start: 4796480, end: 4796655 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Tahiti", start: 4796655, end: 4796820 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Tarawa", start: 4796820, end: 4796986 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Tongatapu", start: 4796986, end: 4797358 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Truk", start: 4797358, end: 4797544 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Wake", start: 4797544, end: 4797710 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Wallis", start: 4797710, end: 4797876 }, { filename: "/tmp/pglite/share/postgresql/timezone/Pacific/Yap", start: 4797876, end: 4798062 }, { filename: "/tmp/pglite/share/postgresql/timezone/Poland", start: 4798062, end: 4800716 }, { filename: "/tmp/pglite/share/postgresql/timezone/Portugal", start: 4800716, end: 4804243 }, { filename: "/tmp/pglite/share/postgresql/timezone/ROC", start: 4804243, end: 4805004 }, { filename: "/tmp/pglite/share/postgresql/timezone/ROK", start: 4805004, end: 4805621 }, { filename: "/tmp/pglite/share/postgresql/timezone/Singapore", start: 4805621, end: 4806036 }, { filename: "/tmp/pglite/share/postgresql/timezone/Turkey", start: 4806036, end: 4807983 }, { filename: "/tmp/pglite/share/postgresql/timezone/UCT", start: 4807983, end: 4808097 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Alaska", start: 4808097, end: 4810468 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Aleutian", start: 4810468, end: 4812824 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Arizona", start: 4812824, end: 4813184 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Central", start: 4813184, end: 4816776 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/East-Indiana", start: 4816776, end: 4818458 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Eastern", start: 4818458, end: 4822010 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Hawaii", start: 4822010, end: 4822339 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Indiana-Starke", start: 4822339, end: 4824783 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Michigan", start: 4824783, end: 4827013 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Mountain", start: 4827013, end: 4829473 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Pacific", start: 4829473, end: 4832325 }, { filename: "/tmp/pglite/share/postgresql/timezone/US/Samoa", start: 4832325, end: 4832500 }, { filename: "/tmp/pglite/share/postgresql/timezone/UTC", start: 4832500, end: 4832614 }, { filename: "/tmp/pglite/share/postgresql/timezone/Universal", start: 4832614, end: 4832728 }, { filename: "/tmp/pglite/share/postgresql/timezone/W-SU", start: 4832728, end: 4834263 }, { filename: "/tmp/pglite/share/postgresql/timezone/WET", start: 4834263, end: 4837790 }, { filename: "/tmp/pglite/share/postgresql/timezone/Zulu", start: 4837790, end: 4837904 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Africa.txt", start: 4837904, end: 4844877 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/America.txt", start: 4844877, end: 4855884 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Antarctica.txt", start: 4855884, end: 4857018 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Asia.txt", start: 4857018, end: 4865329 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Atlantic.txt", start: 4865329, end: 4868862 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Australia", start: 4868862, end: 4869997 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Australia.txt", start: 4869997, end: 4873381 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Default", start: 4873381, end: 4900595 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Etc.txt", start: 4900595, end: 4901845 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Europe.txt", start: 4901845, end: 4910591 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/India", start: 4910591, end: 4911184 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Indian.txt", start: 4911184, end: 4912445 }, { filename: "/tmp/pglite/share/postgresql/timezonesets/Pacific.txt", start: 4912445, end: 4916213 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/danish.stop", start: 4916213, end: 4916637 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/dutch.stop", start: 4916637, end: 4917090 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/english.stop", start: 4917090, end: 4917712 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/finnish.stop", start: 4917712, end: 4919291 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/french.stop", start: 4919291, end: 4920096 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/german.stop", start: 4920096, end: 4921445 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/hungarian.stop", start: 4921445, end: 4922672 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/hunspell_sample.affix", start: 4922672, end: 4922915 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/hunspell_sample_long.affix", start: 4922915, end: 4923548 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/hunspell_sample_long.dict", start: 4923548, end: 4923646 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/hunspell_sample_num.affix", start: 4923646, end: 4924108 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/hunspell_sample_num.dict", start: 4924108, end: 4924237 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/ispell_sample.affix", start: 4924237, end: 4924702 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/ispell_sample.dict", start: 4924702, end: 4924783 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/italian.stop", start: 4924783, end: 4926437 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/nepali.stop", start: 4926437, end: 4930698 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/norwegian.stop", start: 4930698, end: 4931549 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/portuguese.stop", start: 4931549, end: 4932816 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/russian.stop", start: 4932816, end: 4934051 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/spanish.stop", start: 4934051, end: 4936229 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/swedish.stop", start: 4936229, end: 4936788 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/synonym_sample.syn", start: 4936788, end: 4936861 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/thesaurus_sample.ths", start: 4936861, end: 4937334 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/turkish.stop", start: 4937334, end: 4937594 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/unaccent.rules", start: 4937594, end: 4947597 }, { filename: "/tmp/pglite/share/postgresql/tsearch_data/xsyn_sample.rules", start: 4947597, end: 4947736 }], remote_package_size: 4947736 });
    })();
    var moduleOverrides = Object.assign({}, Module), arguments_ = [], thisProgram = "./this.program", quit_ = (e, t2) => {
      throw t2;
    }, scriptDirectory = "";
    function locateFile(e) {
      return Module.locateFile ? Module.locateFile(e, scriptDirectory) : scriptDirectory + e;
    }
    var readAsync, readBinary;
    if (ENVIRONMENT_IS_NODE) {
      var fs = require("fs"), nodePath = require("path");
      import.meta.url.startsWith("data:") || (scriptDirectory = nodePath.dirname(require("url").fileURLToPath(import.meta.url)) + "/"), readBinary = (e) => {
        e = isFileURI(e) ? new URL(e) : e;
        var t2 = fs.readFileSync(e);
        return t2;
      }, readAsync = async (e, t2 = true) => {
        e = isFileURI(e) ? new URL(e) : e;
        var r = fs.readFileSync(e, t2 ? undefined : "utf8");
        return r;
      }, !Module.thisProgram && process.argv.length > 1 && (thisProgram = process.argv[1].replace(/\\/g, "/")), arguments_ = process.argv.slice(2), quit_ = (e, t2) => {
        throw process.exitCode = e, t2;
      };
    } else
      (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && (ENVIRONMENT_IS_WORKER ? scriptDirectory = self.location.href : typeof document < "u" && document.currentScript && (scriptDirectory = document.currentScript.src), _scriptName && (scriptDirectory = _scriptName), scriptDirectory.startsWith("blob:") ? scriptDirectory = "" : scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1), readAsync = async (e) => {
        var t2 = await fetch(e, { credentials: "same-origin" });
        if (t2.ok)
          return t2.arrayBuffer();
        throw new Error(t2.status + " : " + t2.url);
      });
    var out = Module.print || console.log.bind(console), err = Module.printErr || console.error.bind(console);
    Object.assign(Module, moduleOverrides), moduleOverrides = null, Module.arguments && (arguments_ = Module.arguments), Module.thisProgram && (thisProgram = Module.thisProgram);
    var dynamicLibraries = Module.dynamicLibraries || [], wasmBinary = Module.wasmBinary;
    function intArrayFromBase64(e) {
      if (typeof ENVIRONMENT_IS_NODE < "u" && ENVIRONMENT_IS_NODE) {
        var t2 = Buffer.from(e, "base64");
        return new Uint8Array(t2.buffer, t2.byteOffset, t2.length);
      }
      for (var r = atob(e), a2 = new Uint8Array(r.length), o4 = 0;o4 < r.length; ++o4)
        a2[o4] = r.charCodeAt(o4);
      return a2;
    }
    var wasmMemory, ABORT = false, EXITSTATUS;
    function assert(e, t2) {
      e || abort(t2);
    }
    var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAP64, HEAPU64, HEAPF64;
    function updateMemoryViews() {
      var e = wasmMemory.buffer;
      Module.HEAP8 = HEAP8 = new Int8Array(e), Module.HEAP16 = HEAP16 = new Int16Array(e), Module.HEAPU8 = HEAPU8 = new Uint8Array(e), Module.HEAPU16 = HEAPU16 = new Uint16Array(e), Module.HEAP32 = HEAP32 = new Int32Array(e), Module.HEAPU32 = HEAPU32 = new Uint32Array(e), Module.HEAPF32 = HEAPF32 = new Float32Array(e), Module.HEAPF64 = HEAPF64 = new Float64Array(e), Module.HEAP64 = HEAP64 = new BigInt64Array(e), Module.HEAPU64 = HEAPU64 = new BigUint64Array(e);
    }
    if (Module.wasmMemory)
      wasmMemory = Module.wasmMemory;
    else {
      var INITIAL_MEMORY = Module.INITIAL_MEMORY || 16777216;
      wasmMemory = new WebAssembly.Memory({ initial: INITIAL_MEMORY / 65536, maximum: 32768 });
    }
    updateMemoryViews();
    var __ATPRERUN__ = [], __ATINIT__ = [], __ATMAIN__ = [], __ATPOSTRUN__ = [], __RELOC_FUNCS__ = [], runtimeInitialized = false;
    function preRun() {
      if (Module.preRun)
        for (typeof Module.preRun == "function" && (Module.preRun = [Module.preRun]);Module.preRun.length; )
          addOnPreRun(Module.preRun.shift());
      callRuntimeCallbacks(__ATPRERUN__);
    }
    function initRuntime() {
      runtimeInitialized = true, callRuntimeCallbacks(__RELOC_FUNCS__), !Module.noFSInit && !FS.initialized && FS.init(), FS.ignorePermissions = false, TTY.init(), SOCKFS.root = FS.mount(SOCKFS, {}, null), PIPEFS.root = FS.mount(PIPEFS, {}, null), callRuntimeCallbacks(__ATINIT__);
    }
    function preMain() {
      callRuntimeCallbacks(__ATMAIN__);
    }
    function postRun() {
      if (Module.postRun)
        for (typeof Module.postRun == "function" && (Module.postRun = [Module.postRun]);Module.postRun.length; )
          addOnPostRun(Module.postRun.shift());
      callRuntimeCallbacks(__ATPOSTRUN__);
    }
    function addOnPreRun(e) {
      __ATPRERUN__.unshift(e);
    }
    function addOnInit(e) {
      __ATINIT__.unshift(e);
    }
    function addOnPostRun(e) {
      __ATPOSTRUN__.unshift(e);
    }
    var runDependencies = 0, dependenciesFulfilled = null;
    function getUniqueRunDependency(e) {
      return e;
    }
    function addRunDependency(e) {
      runDependencies++, Module.monitorRunDependencies?.(runDependencies);
    }
    function removeRunDependency(e) {
      if (runDependencies--, Module.monitorRunDependencies?.(runDependencies), runDependencies == 0 && dependenciesFulfilled) {
        var t2 = dependenciesFulfilled;
        dependenciesFulfilled = null, t2();
      }
    }
    function abort(e) {
      Module.onAbort?.(e), e = "Aborted(" + e + ")", err(e), ABORT = true, e += ". Build with -sASSERTIONS for more info.";
      var t2 = new WebAssembly.RuntimeError(e);
      throw readyPromiseReject(t2), t2;
    }
    var dataURIPrefix = "data:application/octet-stream;base64,", isDataURI = (e) => e.startsWith(dataURIPrefix), isFileURI = (e) => e.startsWith("file://");
    function findWasmBinary() {
      if (Module.locateFile) {
        var e = "pglite.wasm";
        return isDataURI(e) ? e : locateFile(e);
      }
      return new URL("pglite.wasm", import.meta.url).href;
    }
    var wasmBinaryFile;
    function getBinarySync(e) {
      if (e == wasmBinaryFile && wasmBinary)
        return new Uint8Array(wasmBinary);
      if (readBinary)
        return readBinary(e);
      throw "both async and sync fetching of the wasm failed";
    }
    async function getWasmBinary(e) {
      if (!wasmBinary)
        try {
          var t2 = await readAsync(e);
          return new Uint8Array(t2);
        } catch {
        }
      return getBinarySync(e);
    }
    async function instantiateArrayBuffer(e, t2) {
      try {
        var r = await getWasmBinary(e), a2 = await WebAssembly.instantiate(r, t2);
        return a2;
      } catch (o4) {
        err(`failed to asynchronously prepare wasm: ${o4}`), abort(o4);
      }
    }
    async function instantiateAsync(e, t2, r) {
      if (!e && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(t2) && !ENVIRONMENT_IS_NODE && typeof fetch == "function")
        try {
          var a2 = fetch(t2, { credentials: "same-origin" }), o4 = await WebAssembly.instantiateStreaming(a2, r);
          return o4;
        } catch (s4) {
          err(`wasm streaming compile failed: ${s4}`), err("falling back to ArrayBuffer instantiation");
        }
      return instantiateArrayBuffer(t2, r);
    }
    function getWasmImports() {
      return { env: wasmImports, wasi_snapshot_preview1: wasmImports, "GOT.mem": new Proxy(wasmImports, GOTHandler), "GOT.func": new Proxy(wasmImports, GOTHandler) };
    }
    async function createWasm() {
      function e(o4, s4) {
        wasmExports = o4.exports, wasmExports = relocateExports(wasmExports, 12582912);
        var l3 = getDylinkMetadata(s4);
        return l3.neededDynlibs && (dynamicLibraries = l3.neededDynlibs.concat(dynamicLibraries)), mergeLibSymbols(wasmExports, "main"), LDSO.init(), loadDylibs(), addOnInit(wasmExports.__wasm_call_ctors), __RELOC_FUNCS__.push(wasmExports.__wasm_apply_data_relocs), removeRunDependency("wasm-instantiate"), wasmExports;
      }
      addRunDependency("wasm-instantiate");
      function t2(o4) {
        e(o4.instance, o4.module);
      }
      var r = getWasmImports();
      if (Module.instantiateWasm)
        try {
          return Module.instantiateWasm(r, e);
        } catch (o4) {
          err(`Module.instantiateWasm callback failed with error: ${o4}`), readyPromiseReject(o4);
        }
      wasmBinaryFile ?? (wasmBinaryFile = findWasmBinary());
      try {
        var a2 = await instantiateAsync(wasmBinary, wasmBinaryFile, r);
        return t2(a2), a2;
      } catch (o4) {
        readyPromiseReject(o4);
        return;
      }
    }
    var ASM_CONSTS = { 15165628: (e) => {
      Module.is_worker = typeof WorkerGlobalScope < "u" && self instanceof WorkerGlobalScope, Module.FD_BUFFER_MAX = e, Module.emscripten_copy_to = console.warn;
    }, 15165800: () => {
      Module.postMessage = function(t2) {
        console.log("# pg_main_emsdk.c:544: onCustomMessage:", t2);
      };
    }, 15165929: () => {
      if (Module.is_worker) {
        let t2 = function(r) {
          console.log("onCustomMessage:", r);
        };
        var e = t2;
        Module.onCustomMessage = t2;
      } else
        Module.postMessage = function(r) {
          switch (r.type) {
            case "raw":
              break;
            case "stdin": {
              stringToUTF8(r.data, 1, Module.FD_BUFFER_MAX);
              break;
            }
            case "rcon":
              break;
            default:
              console.warn("custom_postMessage?", r);
          }
        };
    } };

    class ExitStatus {
      constructor(t2) {
        P(this, "name", "ExitStatus");
        this.message = `Program terminated with exit(${t2})`, this.status = t2;
      }
    }
    var GOT = {}, currentModuleWeakSymbols = new Set([]), GOTHandler = { get(e, t2) {
      var r = GOT[t2];
      return r || (r = GOT[t2] = new WebAssembly.Global({ value: "i32", mutable: true })), currentModuleWeakSymbols.has(t2) || (r.required = true), r;
    } }, callRuntimeCallbacks = (e) => {
      for (;e.length > 0; )
        e.shift()(Module);
    }, UTF8Decoder = typeof TextDecoder < "u" ? new TextDecoder : undefined, UTF8ArrayToString = (e, t2 = 0, r = NaN) => {
      for (var a2 = t2 + r, o4 = t2;e[o4] && !(o4 >= a2); )
        ++o4;
      if (o4 - t2 > 16 && e.buffer && UTF8Decoder)
        return UTF8Decoder.decode(e.subarray(t2, o4));
      for (var s4 = "";t2 < o4; ) {
        var l3 = e[t2++];
        if (!(l3 & 128)) {
          s4 += String.fromCharCode(l3);
          continue;
        }
        var _3 = e[t2++] & 63;
        if ((l3 & 224) == 192) {
          s4 += String.fromCharCode((l3 & 31) << 6 | _3);
          continue;
        }
        var n3 = e[t2++] & 63;
        if ((l3 & 240) == 224 ? l3 = (l3 & 15) << 12 | _3 << 6 | n3 : l3 = (l3 & 7) << 18 | _3 << 12 | n3 << 6 | e[t2++] & 63, l3 < 65536)
          s4 += String.fromCharCode(l3);
        else {
          var m5 = l3 - 65536;
          s4 += String.fromCharCode(55296 | m5 >> 10, 56320 | m5 & 1023);
        }
      }
      return s4;
    }, getDylinkMetadata = (e) => {
      var t2 = 0, r = 0;
      function a2() {
        return e[t2++];
      }
      function o4() {
        for (var P4 = 0, R3 = 1;; ) {
          var k2 = e[t2++];
          if (P4 += (k2 & 127) * R3, R3 *= 128, !(k2 & 128))
            break;
        }
        return P4;
      }
      function s4() {
        var P4 = o4();
        return t2 += P4, UTF8ArrayToString(e, t2 - P4, P4);
      }
      function l3(P4, R3) {
        if (P4)
          throw new Error(R3);
      }
      var _3 = "dylink.0";
      if (e instanceof WebAssembly.Module) {
        var n3 = WebAssembly.Module.customSections(e, _3);
        n3.length === 0 && (_3 = "dylink", n3 = WebAssembly.Module.customSections(e, _3)), l3(n3.length === 0, "need dylink section"), e = new Uint8Array(n3[0]), r = e.length;
      } else {
        var m5 = new Uint32Array(new Uint8Array(e.subarray(0, 24)).buffer), p4 = m5[0] == 1836278016;
        l3(!p4, "need to see wasm magic number"), l3(e[8] !== 0, "need the dylink section to be first"), t2 = 9;
        var d3 = o4();
        r = t2 + d3, _3 = s4();
      }
      var g5 = { neededDynlibs: [], tlsExports: new Set, weakImports: new Set };
      if (_3 == "dylink") {
        g5.memorySize = o4(), g5.memoryAlign = o4(), g5.tableSize = o4(), g5.tableAlign = o4();
        for (var u2 = o4(), f3 = 0;f3 < u2; ++f3) {
          var c2 = s4();
          g5.neededDynlibs.push(c2);
        }
      } else {
        l3(_3 !== "dylink.0");
        for (var w4 = 1, v3 = 2, S3 = 3, x6 = 4, y4 = 256, M3 = 3, E3 = 1;t2 < r; ) {
          var b3 = a2(), U3 = o4();
          if (b3 === w4)
            g5.memorySize = o4(), g5.memoryAlign = o4(), g5.tableSize = o4(), g5.tableAlign = o4();
          else if (b3 === v3)
            for (var u2 = o4(), f3 = 0;f3 < u2; ++f3)
              c2 = s4(), g5.neededDynlibs.push(c2);
          else if (b3 === S3)
            for (var z2 = o4();z2--; ) {
              var W3 = s4(), D4 = o4();
              D4 & y4 && g5.tlsExports.add(W3);
            }
          else if (b3 === x6)
            for (var z2 = o4();z2--; ) {
              var N2 = s4(), W3 = s4(), D4 = o4();
              (D4 & M3) == E3 && g5.weakImports.add(W3);
            }
          else
            t2 += U3;
        }
      }
      return g5;
    };
    function getValue(e, t2 = "i8") {
      switch (t2.endsWith("*") && (t2 = "*"), t2) {
        case "i1":
          return HEAP8[e];
        case "i8":
          return HEAP8[e];
        case "i16":
          return HEAP16[e >> 1];
        case "i32":
          return HEAP32[e >> 2];
        case "i64":
          return HEAP64[e >> 3];
        case "float":
          return HEAPF32[e >> 2];
        case "double":
          return HEAPF64[e >> 3];
        case "*":
          return HEAPU32[e >> 2];
        default:
          abort(`invalid type for getValue: ${t2}`);
      }
    }
    var newDSO = (e, t2, r) => {
      var a2 = { refcount: Infinity, name: e, exports: r, global: true };
      return LDSO.loadedLibsByName[e] = a2, t2 != null && (LDSO.loadedLibsByHandle[t2] = a2), a2;
    }, LDSO = { loadedLibsByName: {}, loadedLibsByHandle: {}, init() {
      newDSO("__main__", 0, wasmImports);
    } }, ___heap_base = 15399760, alignMemory = (e, t2) => Math.ceil(e / t2) * t2, getMemory = (e) => {
      if (runtimeInitialized)
        return _calloc(e, 1);
      var t2 = ___heap_base, r = t2 + alignMemory(e, 16);
      return ___heap_base = r, GOT.__heap_base.value = r, t2;
    }, isInternalSym = (e) => ["__cpp_exception", "__c_longjmp", "__wasm_apply_data_relocs", "__dso_handle", "__tls_size", "__tls_align", "__set_stack_limits", "_emscripten_tls_init", "__wasm_init_tls", "__wasm_call_ctors", "__start_em_asm", "__stop_em_asm", "__start_em_js", "__stop_em_js"].includes(e) || e.startsWith("__em_js__"), uleb128Encode = (e, t2) => {
      e < 128 ? t2.push(e) : t2.push(e % 128 | 128, e >> 7);
    }, sigToWasmTypes = (e) => {
      for (var t2 = { i: "i32", j: "i64", f: "f32", d: "f64", e: "externref", p: "i32" }, r = { parameters: [], results: e[0] == "v" ? [] : [t2[e[0]]] }, a2 = 1;a2 < e.length; ++a2)
        r.parameters.push(t2[e[a2]]);
      return r;
    }, generateFuncType = (e, t2) => {
      var r = e.slice(0, 1), a2 = e.slice(1), o4 = { i: 127, p: 127, j: 126, f: 125, d: 124, e: 111 };
      t2.push(96), uleb128Encode(a2.length, t2);
      for (var s4 = 0;s4 < a2.length; ++s4)
        t2.push(o4[a2[s4]]);
      r == "v" ? t2.push(0) : t2.push(1, o4[r]);
    }, convertJsFunctionToWasm = (e, t2) => {
      if (typeof WebAssembly.Function == "function")
        return new WebAssembly.Function(sigToWasmTypes(t2), e);
      var r = [1];
      generateFuncType(t2, r);
      var a2 = [0, 97, 115, 109, 1, 0, 0, 0, 1];
      uleb128Encode(r.length, a2), a2.push(...r), a2.push(2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0);
      var o4 = new WebAssembly.Module(new Uint8Array(a2)), s4 = new WebAssembly.Instance(o4, { e: { f: e } }), l3 = s4.exports.f;
      return l3;
    }, wasmTableMirror = [], wasmTable = new WebAssembly.Table({ initial: 5918, element: "anyfunc" }), getWasmTableEntry = (e) => {
      var t2 = wasmTableMirror[e];
      return t2 || (e >= wasmTableMirror.length && (wasmTableMirror.length = e + 1), wasmTableMirror[e] = t2 = wasmTable.get(e)), t2;
    }, updateTableMap = (e, t2) => {
      if (functionsInTableMap)
        for (var r = e;r < e + t2; r++) {
          var a2 = getWasmTableEntry(r);
          a2 && functionsInTableMap.set(a2, r);
        }
    }, functionsInTableMap, getFunctionAddress = (e) => (functionsInTableMap || (functionsInTableMap = new WeakMap, updateTableMap(0, wasmTable.length)), functionsInTableMap.get(e) || 0), freeTableIndexes = [], getEmptyTableSlot = () => {
      if (freeTableIndexes.length)
        return freeTableIndexes.pop();
      try {
        wasmTable.grow(1);
      } catch (e) {
        throw e instanceof RangeError ? "Unable to grow wasm table. Set ALLOW_TABLE_GROWTH." : e;
      }
      return wasmTable.length - 1;
    }, setWasmTableEntry = (e, t2) => {
      wasmTable.set(e, t2), wasmTableMirror[e] = wasmTable.get(e);
    }, addFunction = (e, t2) => {
      var r = getFunctionAddress(e);
      if (r)
        return r;
      var a2 = getEmptyTableSlot();
      try {
        setWasmTableEntry(a2, e);
      } catch (s4) {
        if (!(s4 instanceof TypeError))
          throw s4;
        var o4 = convertJsFunctionToWasm(e, t2);
        setWasmTableEntry(a2, o4);
      }
      return functionsInTableMap.set(e, a2), a2;
    }, updateGOT = (e, t2) => {
      for (var r in e)
        if (!isInternalSym(r)) {
          var a2 = e[r];
          GOT[r] || (GOT[r] = new WebAssembly.Global({ value: "i32", mutable: true })), (t2 || GOT[r].value == 0) && (typeof a2 == "function" ? GOT[r].value = addFunction(a2) : typeof a2 == "number" ? GOT[r].value = a2 : err(`unhandled export type for '${r}': ${typeof a2}`));
        }
    }, relocateExports = (e, t2, r) => {
      var a2 = {};
      for (var o4 in e) {
        var s4 = e[o4];
        typeof s4 == "object" && (s4 = s4.value), typeof s4 == "number" && (s4 += t2), a2[o4] = s4;
      }
      return updateGOT(a2, r), a2;
    }, isSymbolDefined = (e) => {
      var t2 = wasmImports[e];
      return !(!t2 || t2.stub);
    }, dynCall = (e, t2, r = []) => {
      var a2 = getWasmTableEntry(t2)(...r);
      return a2;
    }, stackSave = () => _emscripten_stack_get_current(), stackRestore = (e) => __emscripten_stack_restore(e), createInvokeFunction = (e) => (t2, ...r) => {
      var a2 = stackSave();
      try {
        return dynCall(e, t2, r);
      } catch (o4) {
        if (stackRestore(a2), o4 !== o4 + 0)
          throw o4;
        if (_setThrew(1, 0), e[0] == "j")
          return 0n;
      }
    }, resolveGlobalSymbol = (e, t2 = false) => {
      var r;
      return isSymbolDefined(e) ? r = wasmImports[e] : e.startsWith("invoke_") && (r = wasmImports[e] = createInvokeFunction(e.split("_")[1])), { sym: r, name: e };
    }, UTF8ToString = (e, t2) => e ? UTF8ArrayToString(HEAPU8, e, t2) : "", loadWebAssemblyModule = (binary, flags, libName, localScope, handle) => {
      var metadata = getDylinkMetadata(binary);
      currentModuleWeakSymbols = metadata.weakImports;
      function loadModule() {
        var firstLoad = !handle || !HEAP8[handle + 8];
        if (firstLoad) {
          var memAlign = Math.pow(2, metadata.memoryAlign), memoryBase = metadata.memorySize ? alignMemory(getMemory(metadata.memorySize + memAlign), memAlign) : 0, tableBase = metadata.tableSize ? wasmTable.length : 0;
          handle && (HEAP8[handle + 8] = 1, HEAPU32[handle + 12 >> 2] = memoryBase, HEAP32[handle + 16 >> 2] = metadata.memorySize, HEAPU32[handle + 20 >> 2] = tableBase, HEAP32[handle + 24 >> 2] = metadata.tableSize);
        } else
          memoryBase = HEAPU32[handle + 12 >> 2], tableBase = HEAPU32[handle + 20 >> 2];
        var tableGrowthNeeded = tableBase + metadata.tableSize - wasmTable.length;
        tableGrowthNeeded > 0 && wasmTable.grow(tableGrowthNeeded);
        var moduleExports;
        function resolveSymbol(e) {
          var t2 = resolveGlobalSymbol(e).sym;
          return !t2 && localScope && (t2 = localScope[e]), t2 || (t2 = moduleExports[e]), t2;
        }
        var proxyHandler = { get(e, t2) {
          switch (t2) {
            case "__memory_base":
              return memoryBase;
            case "__table_base":
              return tableBase;
          }
          if (t2 in wasmImports && !wasmImports[t2].stub)
            return wasmImports[t2];
          if (!(t2 in e)) {
            var r;
            e[t2] = (...a2) => {
              if (r || (r = resolveSymbol(t2)), !r)
                throw new Error;
              return r(...a2);
            };
          }
          return e[t2];
        } }, proxy = new Proxy({}, proxyHandler), info = { "GOT.mem": new Proxy({}, GOTHandler), "GOT.func": new Proxy({}, GOTHandler), env: proxy, wasi_snapshot_preview1: proxy };
        function postInstantiation(module, instance) {
          updateTableMap(tableBase, metadata.tableSize), moduleExports = relocateExports(instance.exports, memoryBase), flags.allowUndefined || reportUndefinedSymbols();
          function addEmAsm(addr, body) {
            for (var args = [], arity = 0;arity < 16 && body.indexOf("$" + arity) != -1; arity++)
              args.push("$" + arity);
            args = args.join(",");
            var func = `(${args}) => { ${body} };`;
            ASM_CONSTS[start] = eval(func);
          }
          if ("__start_em_asm" in moduleExports)
            for (var { __start_em_asm: start, __stop_em_asm: stop } = moduleExports;start < stop; ) {
              var jsString = UTF8ToString(start);
              addEmAsm(start, jsString), start = HEAPU8.indexOf(0, start) + 1;
            }
          function addEmJs(name, cSig, body) {
            var jsArgs = [];
            if (cSig = cSig.slice(1, -1), cSig != "void") {
              cSig = cSig.split(",");
              for (var i in cSig) {
                var jsArg = cSig[i].split(" ").pop();
                jsArgs.push(jsArg.replaceAll("*", ""));
              }
            }
            var func = `(${jsArgs}) => ${body};`;
            moduleExports[name] = eval(func);
          }
          for (var name in moduleExports)
            if (name.startsWith("__em_js__")) {
              var start = moduleExports[name], jsString = UTF8ToString(start), parts = jsString.split("<::>");
              addEmJs(name.replace("__em_js__", ""), parts[0], parts[1]), delete moduleExports[name];
            }
          var applyRelocs = moduleExports.__wasm_apply_data_relocs;
          applyRelocs && (runtimeInitialized ? applyRelocs() : __RELOC_FUNCS__.push(applyRelocs));
          var init = moduleExports.__wasm_call_ctors;
          return init && (runtimeInitialized ? init() : __ATINIT__.push(init)), moduleExports;
        }
        if (flags.loadAsync) {
          if (binary instanceof WebAssembly.Module) {
            var instance = new WebAssembly.Instance(binary, info);
            return Promise.resolve(postInstantiation(binary, instance));
          }
          return WebAssembly.instantiate(binary, info).then((e) => postInstantiation(e.module, e.instance));
        }
        var module = binary instanceof WebAssembly.Module ? binary : new WebAssembly.Module(binary), instance = new WebAssembly.Instance(module, info);
        return postInstantiation(module, instance);
      }
      return flags.loadAsync ? metadata.neededDynlibs.reduce((e, t2) => e.then(() => loadDynamicLibrary(t2, flags, localScope)), Promise.resolve()).then(loadModule) : (metadata.neededDynlibs.forEach((e) => loadDynamicLibrary(e, flags, localScope)), loadModule());
    }, mergeLibSymbols = (e, t2) => {
      for (var [r, a2] of Object.entries(e)) {
        let o4 = (l3) => {
          isSymbolDefined(l3) || (wasmImports[l3] = a2);
        };
        o4(r);
        let s4 = "__main_argc_argv";
        r == "main" && o4(s4), r == s4 && o4("main");
      }
    }, asyncLoad = async (e) => {
      var t2 = await readAsync(e);
      return new Uint8Array(t2);
    }, preloadPlugins = Module.preloadPlugins || [], registerWasmPlugin = () => {
      var e = { promiseChainEnd: Promise.resolve(), canHandle: (t2) => !Module.noWasmDecoding && t2.endsWith(".so"), handle: (t2, r, a2, o4) => {
        e.promiseChainEnd = e.promiseChainEnd.then(() => loadWebAssemblyModule(t2, { loadAsync: true, nodelete: true }, r, {})).then((s4) => {
          preloadedWasm[r] = s4, a2(t2);
        }, (s4) => {
          err(`failed to instantiate wasm: ${r}: ${s4}`), o4();
        });
      } };
      preloadPlugins.push(e);
    }, preloadedWasm = {};
    function loadDynamicLibrary(e, t2 = { global: true, nodelete: true }, r, a2) {
      var o4 = LDSO.loadedLibsByName[e];
      if (o4)
        return t2.global ? o4.global || (o4.global = true, mergeLibSymbols(o4.exports, e)) : r && Object.assign(r, o4.exports), t2.nodelete && o4.refcount !== Infinity && (o4.refcount = Infinity), o4.refcount++, a2 && (LDSO.loadedLibsByHandle[a2] = o4), t2.loadAsync ? Promise.resolve(true) : true;
      o4 = newDSO(e, a2, "loading"), o4.refcount = t2.nodelete ? Infinity : 1, o4.global = t2.global;
      function s4() {
        if (a2) {
          var n3 = HEAPU32[a2 + 28 >> 2], m5 = HEAPU32[a2 + 32 >> 2];
          if (n3 && m5) {
            var p4 = HEAP8.slice(n3, n3 + m5);
            return t2.loadAsync ? Promise.resolve(p4) : p4;
          }
        }
        var d3 = locateFile(e);
        if (t2.loadAsync)
          return asyncLoad(d3);
        if (!readBinary)
          throw new Error(`${d3}: file not found, and synchronous loading of external files is not available`);
        return readBinary(d3);
      }
      function l3() {
        var n3 = preloadedWasm[e];
        return n3 ? t2.loadAsync ? Promise.resolve(n3) : n3 : t2.loadAsync ? s4().then((m5) => loadWebAssemblyModule(m5, t2, e, r, a2)) : loadWebAssemblyModule(s4(), t2, e, r, a2);
      }
      function _3(n3) {
        o4.global ? mergeLibSymbols(n3, e) : r && Object.assign(r, n3), o4.exports = n3;
      }
      return t2.loadAsync ? l3().then((n3) => (_3(n3), true)) : (_3(l3()), true);
    }
    var reportUndefinedSymbols = () => {
      for (var [e, t2] of Object.entries(GOT))
        if (t2.value == 0) {
          var r = resolveGlobalSymbol(e, true).sym;
          if (!r && !t2.required)
            continue;
          if (typeof r == "function")
            t2.value = addFunction(r, r.sig);
          else if (typeof r == "number")
            t2.value = r;
          else
            throw new Error(`bad export type for '${e}': ${typeof r}`);
        }
    }, loadDylibs = () => {
      if (!dynamicLibraries.length) {
        reportUndefinedSymbols();
        return;
      }
      addRunDependency("loadDylibs"), dynamicLibraries.reduce((e, t2) => e.then(() => loadDynamicLibrary(t2, { loadAsync: true, global: true, nodelete: true, allowUndefined: true })), Promise.resolve()).then(() => {
        reportUndefinedSymbols(), removeRunDependency("loadDylibs");
      });
    }, noExitRuntime = Module.noExitRuntime || true;
    function setValue(e, t2, r = "i8") {
      switch (r.endsWith("*") && (r = "*"), r) {
        case "i1":
          HEAP8[e] = t2;
          break;
        case "i8":
          HEAP8[e] = t2;
          break;
        case "i16":
          HEAP16[e >> 1] = t2;
          break;
        case "i32":
          HEAP32[e >> 2] = t2;
          break;
        case "i64":
          HEAP64[e >> 3] = BigInt(t2);
          break;
        case "float":
          HEAPF32[e >> 2] = t2;
          break;
        case "double":
          HEAPF64[e >> 3] = t2;
          break;
        case "*":
          HEAPU32[e >> 2] = t2;
          break;
        default:
          abort(`invalid type for setValue: ${r}`);
      }
    }
    var ___assert_fail = (e, t2, r, a2) => abort(`Assertion failed: ${UTF8ToString(e)}, at: ` + [t2 ? UTF8ToString(t2) : "unknown filename", r, a2 ? UTF8ToString(a2) : "unknown function"]);
    ___assert_fail.sig = "vppip";
    var ___call_sighandler = (e, t2) => getWasmTableEntry(e)(t2);
    ___call_sighandler.sig = "vpi";
    var ___memory_base = new WebAssembly.Global({ value: "i32", mutable: false }, 12582912), ___stack_high = 15399760, ___stack_low = 15334224, ___stack_pointer = new WebAssembly.Global({ value: "i32", mutable: true }, 15399760), PATH = { isAbs: (e) => e.charAt(0) === "/", splitPath: (e) => {
      var t2 = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
      return t2.exec(e).slice(1);
    }, normalizeArray: (e, t2) => {
      for (var r = 0, a2 = e.length - 1;a2 >= 0; a2--) {
        var o4 = e[a2];
        o4 === "." ? e.splice(a2, 1) : o4 === ".." ? (e.splice(a2, 1), r++) : r && (e.splice(a2, 1), r--);
      }
      if (t2)
        for (;r; r--)
          e.unshift("..");
      return e;
    }, normalize: (e) => {
      var t2 = PATH.isAbs(e), r = e.substr(-1) === "/";
      return e = PATH.normalizeArray(e.split("/").filter((a2) => !!a2), !t2).join("/"), !e && !t2 && (e = "."), e && r && (e += "/"), (t2 ? "/" : "") + e;
    }, dirname: (e) => {
      var t2 = PATH.splitPath(e), r = t2[0], a2 = t2[1];
      return !r && !a2 ? "." : (a2 && (a2 = a2.substr(0, a2.length - 1)), r + a2);
    }, basename: (e) => {
      if (e === "/")
        return "/";
      e = PATH.normalize(e), e = e.replace(/\/$/, "");
      var t2 = e.lastIndexOf("/");
      return t2 === -1 ? e : e.substr(t2 + 1);
    }, join: (...e) => PATH.normalize(e.join("/")), join2: (e, t2) => PATH.normalize(e + "/" + t2) }, initRandomFill = () => {
      if (typeof crypto == "object" && typeof crypto.getRandomValues == "function")
        return (a2) => crypto.getRandomValues(a2);
      if (ENVIRONMENT_IS_NODE)
        try {
          var e = require("crypto"), t2 = e.randomFillSync;
          if (t2)
            return (a2) => e.randomFillSync(a2);
          var r = e.randomBytes;
          return (a2) => (a2.set(r(a2.byteLength)), a2);
        } catch {
        }
      abort("initRandomDevice");
    }, randomFill = (e) => (randomFill = initRandomFill())(e), PATH_FS = { resolve: (...e) => {
      for (var t2 = "", r = false, a2 = e.length - 1;a2 >= -1 && !r; a2--) {
        var o4 = a2 >= 0 ? e[a2] : FS.cwd();
        if (typeof o4 != "string")
          throw new TypeError("Arguments to path.resolve must be strings");
        if (!o4)
          return "";
        t2 = o4 + "/" + t2, r = PATH.isAbs(o4);
      }
      return t2 = PATH.normalizeArray(t2.split("/").filter((s4) => !!s4), !r).join("/"), (r ? "/" : "") + t2 || ".";
    }, relative: (e, t2) => {
      e = PATH_FS.resolve(e).substr(1), t2 = PATH_FS.resolve(t2).substr(1);
      function r(m5) {
        for (var p4 = 0;p4 < m5.length && m5[p4] === ""; p4++)
          ;
        for (var d3 = m5.length - 1;d3 >= 0 && m5[d3] === ""; d3--)
          ;
        return p4 > d3 ? [] : m5.slice(p4, d3 - p4 + 1);
      }
      for (var a2 = r(e.split("/")), o4 = r(t2.split("/")), s4 = Math.min(a2.length, o4.length), l3 = s4, _3 = 0;_3 < s4; _3++)
        if (a2[_3] !== o4[_3]) {
          l3 = _3;
          break;
        }
      for (var n3 = [], _3 = l3;_3 < a2.length; _3++)
        n3.push("..");
      return n3 = n3.concat(o4.slice(l3)), n3.join("/");
    } }, FS_stdin_getChar_buffer = [], lengthBytesUTF8 = (e) => {
      for (var t2 = 0, r = 0;r < e.length; ++r) {
        var a2 = e.charCodeAt(r);
        a2 <= 127 ? t2++ : a2 <= 2047 ? t2 += 2 : a2 >= 55296 && a2 <= 57343 ? (t2 += 4, ++r) : t2 += 3;
      }
      return t2;
    }, stringToUTF8Array = (e, t2, r, a2) => {
      if (!(a2 > 0))
        return 0;
      for (var o4 = r, s4 = r + a2 - 1, l3 = 0;l3 < e.length; ++l3) {
        var _3 = e.charCodeAt(l3);
        if (_3 >= 55296 && _3 <= 57343) {
          var n3 = e.charCodeAt(++l3);
          _3 = 65536 + ((_3 & 1023) << 10) | n3 & 1023;
        }
        if (_3 <= 127) {
          if (r >= s4)
            break;
          t2[r++] = _3;
        } else if (_3 <= 2047) {
          if (r + 1 >= s4)
            break;
          t2[r++] = 192 | _3 >> 6, t2[r++] = 128 | _3 & 63;
        } else if (_3 <= 65535) {
          if (r + 2 >= s4)
            break;
          t2[r++] = 224 | _3 >> 12, t2[r++] = 128 | _3 >> 6 & 63, t2[r++] = 128 | _3 & 63;
        } else {
          if (r + 3 >= s4)
            break;
          t2[r++] = 240 | _3 >> 18, t2[r++] = 128 | _3 >> 12 & 63, t2[r++] = 128 | _3 >> 6 & 63, t2[r++] = 128 | _3 & 63;
        }
      }
      return t2[r] = 0, r - o4;
    };
    function intArrayFromString(e, t2, r) {
      var a2 = r > 0 ? r : lengthBytesUTF8(e) + 1, o4 = new Array(a2), s4 = stringToUTF8Array(e, o4, 0, o4.length);
      return t2 && (o4.length = s4), o4;
    }
    var FS_stdin_getChar = () => {
      if (!FS_stdin_getChar_buffer.length) {
        var e = null;
        if (ENVIRONMENT_IS_NODE) {
          var t2 = 256, r = Buffer.alloc(t2), a2 = 0, o4 = process.stdin.fd;
          try {
            a2 = fs.readSync(o4, r, 0, t2);
          } catch (s4) {
            if (s4.toString().includes("EOF"))
              a2 = 0;
            else
              throw s4;
          }
          a2 > 0 && (e = r.slice(0, a2).toString("utf-8"));
        } else
          typeof window < "u" && typeof window.prompt == "function" && (e = window.prompt("Input: "), e !== null && (e += `
`));
        if (!e)
          return null;
        FS_stdin_getChar_buffer = intArrayFromString(e, true);
      }
      return FS_stdin_getChar_buffer.shift();
    }, TTY = { ttys: [], init() {
    }, shutdown() {
    }, register(e, t2) {
      TTY.ttys[e] = { input: [], output: [], ops: t2 }, FS.registerDevice(e, TTY.stream_ops);
    }, stream_ops: { open(e) {
      var t2 = TTY.ttys[e.node.rdev];
      if (!t2)
        throw new FS.ErrnoError(43);
      e.tty = t2, e.seekable = false;
    }, close(e) {
      e.tty.ops.fsync(e.tty);
    }, fsync(e) {
      e.tty.ops.fsync(e.tty);
    }, read(e, t2, r, a2, o4) {
      if (!e.tty || !e.tty.ops.get_char)
        throw new FS.ErrnoError(60);
      for (var s4 = 0, l3 = 0;l3 < a2; l3++) {
        var _3;
        try {
          _3 = e.tty.ops.get_char(e.tty);
        } catch {
          throw new FS.ErrnoError(29);
        }
        if (_3 === undefined && s4 === 0)
          throw new FS.ErrnoError(6);
        if (_3 == null)
          break;
        s4++, t2[r + l3] = _3;
      }
      return s4 && (e.node.atime = Date.now()), s4;
    }, write(e, t2, r, a2, o4) {
      if (!e.tty || !e.tty.ops.put_char)
        throw new FS.ErrnoError(60);
      try {
        for (var s4 = 0;s4 < a2; s4++)
          e.tty.ops.put_char(e.tty, t2[r + s4]);
      } catch {
        throw new FS.ErrnoError(29);
      }
      return a2 && (e.node.mtime = e.node.ctime = Date.now()), s4;
    } }, default_tty_ops: { get_char(e) {
      return FS_stdin_getChar();
    }, put_char(e, t2) {
      t2 === null || t2 === 10 ? (out(UTF8ArrayToString(e.output)), e.output = []) : t2 != 0 && e.output.push(t2);
    }, fsync(e) {
      e.output && e.output.length > 0 && (out(UTF8ArrayToString(e.output)), e.output = []);
    }, ioctl_tcgets(e) {
      return { c_iflag: 25856, c_oflag: 5, c_cflag: 191, c_lflag: 35387, c_cc: [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
    }, ioctl_tcsets(e, t2, r) {
      return 0;
    }, ioctl_tiocgwinsz(e) {
      return [24, 80];
    } }, default_tty1_ops: { put_char(e, t2) {
      t2 === null || t2 === 10 ? (err(UTF8ArrayToString(e.output)), e.output = []) : t2 != 0 && e.output.push(t2);
    }, fsync(e) {
      e.output && e.output.length > 0 && (err(UTF8ArrayToString(e.output)), e.output = []);
    } } }, zeroMemory = (e, t2) => {
      HEAPU8.fill(0, e, e + t2);
    }, mmapAlloc = (e) => {
      e = alignMemory(e, 65536);
      var t2 = _emscripten_builtin_memalign(65536, e);
      return t2 && zeroMemory(t2, e), t2;
    }, MEMFS = { ops_table: null, mount(e) {
      return MEMFS.createNode(null, "/", 16895, 0);
    }, createNode(e, t2, r, a2) {
      if (FS.isBlkdev(r) || FS.isFIFO(r))
        throw new FS.ErrnoError(63);
      MEMFS.ops_table || (MEMFS.ops_table = { dir: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, lookup: MEMFS.node_ops.lookup, mknod: MEMFS.node_ops.mknod, rename: MEMFS.node_ops.rename, unlink: MEMFS.node_ops.unlink, rmdir: MEMFS.node_ops.rmdir, readdir: MEMFS.node_ops.readdir, symlink: MEMFS.node_ops.symlink }, stream: { llseek: MEMFS.stream_ops.llseek } }, file: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: { llseek: MEMFS.stream_ops.llseek, read: MEMFS.stream_ops.read, write: MEMFS.stream_ops.write, allocate: MEMFS.stream_ops.allocate, mmap: MEMFS.stream_ops.mmap, msync: MEMFS.stream_ops.msync } }, link: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, readlink: MEMFS.node_ops.readlink }, stream: {} }, chrdev: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: FS.chrdev_stream_ops } });
      var o4 = FS.createNode(e, t2, r, a2);
      return FS.isDir(o4.mode) ? (o4.node_ops = MEMFS.ops_table.dir.node, o4.stream_ops = MEMFS.ops_table.dir.stream, o4.contents = {}) : FS.isFile(o4.mode) ? (o4.node_ops = MEMFS.ops_table.file.node, o4.stream_ops = MEMFS.ops_table.file.stream, o4.usedBytes = 0, o4.contents = null) : FS.isLink(o4.mode) ? (o4.node_ops = MEMFS.ops_table.link.node, o4.stream_ops = MEMFS.ops_table.link.stream) : FS.isChrdev(o4.mode) && (o4.node_ops = MEMFS.ops_table.chrdev.node, o4.stream_ops = MEMFS.ops_table.chrdev.stream), o4.atime = o4.mtime = o4.ctime = Date.now(), e && (e.contents[t2] = o4, e.atime = e.mtime = e.ctime = o4.atime), o4;
    }, getFileDataAsTypedArray(e) {
      return e.contents ? e.contents.subarray ? e.contents.subarray(0, e.usedBytes) : new Uint8Array(e.contents) : new Uint8Array(0);
    }, expandFileStorage(e, t2) {
      var r = e.contents ? e.contents.length : 0;
      if (!(r >= t2)) {
        var a2 = 1048576;
        t2 = Math.max(t2, r * (r < a2 ? 2 : 1.125) >>> 0), r != 0 && (t2 = Math.max(t2, 256));
        var o4 = e.contents;
        e.contents = new Uint8Array(t2), e.usedBytes > 0 && e.contents.set(o4.subarray(0, e.usedBytes), 0);
      }
    }, resizeFileStorage(e, t2) {
      if (e.usedBytes != t2)
        if (t2 == 0)
          e.contents = null, e.usedBytes = 0;
        else {
          var r = e.contents;
          e.contents = new Uint8Array(t2), r && e.contents.set(r.subarray(0, Math.min(t2, e.usedBytes))), e.usedBytes = t2;
        }
    }, node_ops: { getattr(e) {
      var t2 = {};
      return t2.dev = FS.isChrdev(e.mode) ? e.id : 1, t2.ino = e.id, t2.mode = e.mode, t2.nlink = 1, t2.uid = 0, t2.gid = 0, t2.rdev = e.rdev, FS.isDir(e.mode) ? t2.size = 4096 : FS.isFile(e.mode) ? t2.size = e.usedBytes : FS.isLink(e.mode) ? t2.size = e.link.length : t2.size = 0, t2.atime = new Date(e.atime), t2.mtime = new Date(e.mtime), t2.ctime = new Date(e.ctime), t2.blksize = 4096, t2.blocks = Math.ceil(t2.size / t2.blksize), t2;
    }, setattr(e, t2) {
      for (let r of ["mode", "atime", "mtime", "ctime"])
        t2[r] && (e[r] = t2[r]);
      t2.size !== undefined && MEMFS.resizeFileStorage(e, t2.size);
    }, lookup(e, t2) {
      throw MEMFS.doesNotExistError;
    }, mknod(e, t2, r, a2) {
      return MEMFS.createNode(e, t2, r, a2);
    }, rename(e, t2, r) {
      var a2;
      try {
        a2 = FS.lookupNode(t2, r);
      } catch {
      }
      if (a2) {
        if (FS.isDir(e.mode))
          for (var o4 in a2.contents)
            throw new FS.ErrnoError(55);
        FS.hashRemoveNode(a2);
      }
      delete e.parent.contents[e.name], t2.contents[r] = e, e.name = r, t2.ctime = t2.mtime = e.parent.ctime = e.parent.mtime = Date.now();
    }, unlink(e, t2) {
      delete e.contents[t2], e.ctime = e.mtime = Date.now();
    }, rmdir(e, t2) {
      var r = FS.lookupNode(e, t2);
      for (var a2 in r.contents)
        throw new FS.ErrnoError(55);
      delete e.contents[t2], e.ctime = e.mtime = Date.now();
    }, readdir(e) {
      return [".", "..", ...Object.keys(e.contents)];
    }, symlink(e, t2, r) {
      var a2 = MEMFS.createNode(e, t2, 41471, 0);
      return a2.link = r, a2;
    }, readlink(e) {
      if (!FS.isLink(e.mode))
        throw new FS.ErrnoError(28);
      return e.link;
    } }, stream_ops: { read(e, t2, r, a2, o4) {
      var s4 = e.node.contents;
      if (o4 >= e.node.usedBytes)
        return 0;
      var l3 = Math.min(e.node.usedBytes - o4, a2);
      if (l3 > 8 && s4.subarray)
        t2.set(s4.subarray(o4, o4 + l3), r);
      else
        for (var _3 = 0;_3 < l3; _3++)
          t2[r + _3] = s4[o4 + _3];
      return l3;
    }, write(e, t2, r, a2, o4, s4) {
      if (t2.buffer === HEAP8.buffer && (s4 = false), !a2)
        return 0;
      var l3 = e.node;
      if (l3.mtime = l3.ctime = Date.now(), t2.subarray && (!l3.contents || l3.contents.subarray)) {
        if (s4)
          return l3.contents = t2.subarray(r, r + a2), l3.usedBytes = a2, a2;
        if (l3.usedBytes === 0 && o4 === 0)
          return l3.contents = t2.slice(r, r + a2), l3.usedBytes = a2, a2;
        if (o4 + a2 <= l3.usedBytes)
          return l3.contents.set(t2.subarray(r, r + a2), o4), a2;
      }
      if (MEMFS.expandFileStorage(l3, o4 + a2), l3.contents.subarray && t2.subarray)
        l3.contents.set(t2.subarray(r, r + a2), o4);
      else
        for (var _3 = 0;_3 < a2; _3++)
          l3.contents[o4 + _3] = t2[r + _3];
      return l3.usedBytes = Math.max(l3.usedBytes, o4 + a2), a2;
    }, llseek(e, t2, r) {
      var a2 = t2;
      if (r === 1 ? a2 += e.position : r === 2 && FS.isFile(e.node.mode) && (a2 += e.node.usedBytes), a2 < 0)
        throw new FS.ErrnoError(28);
      return a2;
    }, allocate(e, t2, r) {
      MEMFS.expandFileStorage(e.node, t2 + r), e.node.usedBytes = Math.max(e.node.usedBytes, t2 + r);
    }, mmap(e, t2, r, a2, o4) {
      if (!FS.isFile(e.node.mode))
        throw new FS.ErrnoError(43);
      var s4, l3, _3 = e.node.contents;
      if (!(o4 & 2) && _3 && _3.buffer === HEAP8.buffer)
        l3 = false, s4 = _3.byteOffset;
      else {
        if (l3 = true, s4 = mmapAlloc(t2), !s4)
          throw new FS.ErrnoError(48);
        _3 && ((r > 0 || r + t2 < _3.length) && (_3.subarray ? _3 = _3.subarray(r, r + t2) : _3 = Array.prototype.slice.call(_3, r, r + t2)), HEAP8.set(_3, s4));
      }
      return { ptr: s4, allocated: l3 };
    }, msync(e, t2, r, a2, o4) {
      return MEMFS.stream_ops.write(e, t2, 0, a2, r, false), 0;
    } } }, FS_createDataFile = (e, t2, r, a2, o4, s4) => {
      FS.createDataFile(e, t2, r, a2, o4, s4);
    }, FS_handledByPreloadPlugin = (e, t2, r, a2) => {
      typeof Browser < "u" && Browser.init();
      var o4 = false;
      return preloadPlugins.forEach((s4) => {
        o4 || s4.canHandle(t2) && (s4.handle(e, t2, r, a2), o4 = true);
      }), o4;
    }, FS_createPreloadedFile = (e, t2, r, a2, o4, s4, l3, _3, n3, m5) => {
      var p4 = t2 ? PATH_FS.resolve(PATH.join2(e, t2)) : e, d3 = `cp ${p4}`;
      function g5(u2) {
        function f3(c2) {
          m5?.(), _3 || FS_createDataFile(e, t2, c2, a2, o4, n3), s4?.(), removeRunDependency(d3);
        }
        FS_handledByPreloadPlugin(u2, p4, f3, () => {
          l3?.(), removeRunDependency(d3);
        }) || f3(u2);
      }
      addRunDependency(d3), typeof r == "string" ? asyncLoad(r).then(g5, l3) : g5(r);
    }, FS_modeStringToFlags = (e) => {
      var t2 = { r: 0, "r+": 2, w: 577, "w+": 578, a: 1089, "a+": 1090 }, r = t2[e];
      if (typeof r > "u")
        throw new Error(`Unknown file open mode: ${e}`);
      return r;
    }, FS_getMode = (e, t2) => {
      var r = 0;
      return e && (r |= 365), t2 && (r |= 146), r;
    }, IDBFS = { dbs: {}, indexedDB: () => {
      if (typeof indexedDB < "u")
        return indexedDB;
      var e = null;
      return typeof window == "object" && (e = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB), e;
    }, DB_VERSION: 21, DB_STORE_NAME: "FILE_DATA", queuePersist: (e) => {
      function t2() {
        e.idbPersistState === "again" ? r() : e.idbPersistState = 0;
      }
      function r() {
        e.idbPersistState = "idb", IDBFS.syncfs(e, false, t2);
      }
      e.idbPersistState ? e.idbPersistState === "idb" && (e.idbPersistState = "again") : e.idbPersistState = setTimeout(r, 0);
    }, mount: (e) => {
      var t2 = MEMFS.mount(e);
      if (e?.opts?.autoPersist) {
        t2.idbPersistState = 0;
        var r = t2.node_ops;
        t2.node_ops = Object.assign({}, t2.node_ops), t2.node_ops.mknod = (a2, o4, s4, l3) => {
          var _3 = r.mknod(a2, o4, s4, l3);
          return _3.node_ops = t2.node_ops, _3.idbfs_mount = t2.mount, _3.memfs_stream_ops = _3.stream_ops, _3.stream_ops = Object.assign({}, _3.stream_ops), _3.stream_ops.write = (n3, m5, p4, d3, g5, u2) => (n3.node.isModified = true, _3.memfs_stream_ops.write(n3, m5, p4, d3, g5, u2)), _3.stream_ops.close = (n3) => {
            var m5 = n3.node;
            if (m5.isModified && (IDBFS.queuePersist(m5.idbfs_mount), m5.isModified = false), m5.memfs_stream_ops.close)
              return m5.memfs_stream_ops.close(n3);
          }, _3;
        }, t2.node_ops.mkdir = (...a2) => (IDBFS.queuePersist(t2.mount), r.mkdir(...a2)), t2.node_ops.rmdir = (...a2) => (IDBFS.queuePersist(t2.mount), r.rmdir(...a2)), t2.node_ops.symlink = (...a2) => (IDBFS.queuePersist(t2.mount), r.symlink(...a2)), t2.node_ops.unlink = (...a2) => (IDBFS.queuePersist(t2.mount), r.unlink(...a2)), t2.node_ops.rename = (...a2) => (IDBFS.queuePersist(t2.mount), r.rename(...a2));
      }
      return t2;
    }, syncfs: (e, t2, r) => {
      IDBFS.getLocalSet(e, (a2, o4) => {
        if (a2)
          return r(a2);
        IDBFS.getRemoteSet(e, (s4, l3) => {
          if (s4)
            return r(s4);
          var _3 = t2 ? l3 : o4, n3 = t2 ? o4 : l3;
          IDBFS.reconcile(_3, n3, r);
        });
      });
    }, quit: () => {
      Object.values(IDBFS.dbs).forEach((e) => e.close()), IDBFS.dbs = {};
    }, getDB: (e, t2) => {
      var r = IDBFS.dbs[e];
      if (r)
        return t2(null, r);
      var a2;
      try {
        a2 = IDBFS.indexedDB().open(e, IDBFS.DB_VERSION);
      } catch (o4) {
        return t2(o4);
      }
      if (!a2)
        return t2("Unable to connect to IndexedDB");
      a2.onupgradeneeded = (o4) => {
        var s4 = o4.target.result, l3 = o4.target.transaction, _3;
        s4.objectStoreNames.contains(IDBFS.DB_STORE_NAME) ? _3 = l3.objectStore(IDBFS.DB_STORE_NAME) : _3 = s4.createObjectStore(IDBFS.DB_STORE_NAME), _3.indexNames.contains("timestamp") || _3.createIndex("timestamp", "timestamp", { unique: false });
      }, a2.onsuccess = () => {
        r = a2.result, IDBFS.dbs[e] = r, t2(null, r);
      }, a2.onerror = (o4) => {
        t2(o4.target.error), o4.preventDefault();
      };
    }, getLocalSet: (e, t2) => {
      var r = {};
      function a2(n3) {
        return n3 !== "." && n3 !== "..";
      }
      function o4(n3) {
        return (m5) => PATH.join2(n3, m5);
      }
      for (var s4 = FS.readdir(e.mountpoint).filter(a2).map(o4(e.mountpoint));s4.length; ) {
        var l3 = s4.pop(), _3;
        try {
          _3 = FS.stat(l3);
        } catch (n3) {
          return t2(n3);
        }
        FS.isDir(_3.mode) && s4.push(...FS.readdir(l3).filter(a2).map(o4(l3))), r[l3] = { timestamp: _3.mtime };
      }
      return t2(null, { type: "local", entries: r });
    }, getRemoteSet: (e, t2) => {
      var r = {};
      IDBFS.getDB(e.mountpoint, (a2, o4) => {
        if (a2)
          return t2(a2);
        try {
          var s4 = o4.transaction([IDBFS.DB_STORE_NAME], "readonly");
          s4.onerror = (n3) => {
            t2(n3.target.error), n3.preventDefault();
          };
          var l3 = s4.objectStore(IDBFS.DB_STORE_NAME), _3 = l3.index("timestamp");
          _3.openKeyCursor().onsuccess = (n3) => {
            var m5 = n3.target.result;
            if (!m5)
              return t2(null, { type: "remote", db: o4, entries: r });
            r[m5.primaryKey] = { timestamp: m5.key }, m5.continue();
          };
        } catch (n3) {
          return t2(n3);
        }
      });
    }, loadLocalEntry: (e, t2) => {
      var r, a2;
      try {
        var o4 = FS.lookupPath(e);
        a2 = o4.node, r = FS.stat(e);
      } catch (s4) {
        return t2(s4);
      }
      return FS.isDir(r.mode) ? t2(null, { timestamp: r.mtime, mode: r.mode }) : FS.isFile(r.mode) ? (a2.contents = MEMFS.getFileDataAsTypedArray(a2), t2(null, { timestamp: r.mtime, mode: r.mode, contents: a2.contents })) : t2(new Error("node type not supported"));
    }, storeLocalEntry: (e, t2, r) => {
      try {
        if (FS.isDir(t2.mode))
          FS.mkdirTree(e, t2.mode);
        else if (FS.isFile(t2.mode))
          FS.writeFile(e, t2.contents, { canOwn: true });
        else
          return r(new Error("node type not supported"));
        FS.chmod(e, t2.mode), FS.utime(e, t2.timestamp, t2.timestamp);
      } catch (a2) {
        return r(a2);
      }
      r(null);
    }, removeLocalEntry: (e, t2) => {
      try {
        var r = FS.stat(e);
        FS.isDir(r.mode) ? FS.rmdir(e) : FS.isFile(r.mode) && FS.unlink(e);
      } catch (a2) {
        return t2(a2);
      }
      t2(null);
    }, loadRemoteEntry: (e, t2, r) => {
      var a2 = e.get(t2);
      a2.onsuccess = (o4) => r(null, o4.target.result), a2.onerror = (o4) => {
        r(o4.target.error), o4.preventDefault();
      };
    }, storeRemoteEntry: (e, t2, r, a2) => {
      try {
        var o4 = e.put(r, t2);
      } catch (s4) {
        a2(s4);
        return;
      }
      o4.onsuccess = (s4) => a2(), o4.onerror = (s4) => {
        a2(s4.target.error), s4.preventDefault();
      };
    }, removeRemoteEntry: (e, t2, r) => {
      var a2 = e.delete(t2);
      a2.onsuccess = (o4) => r(), a2.onerror = (o4) => {
        r(o4.target.error), o4.preventDefault();
      };
    }, reconcile: (e, t2, r) => {
      var a2 = 0, o4 = [];
      Object.keys(e.entries).forEach((d3) => {
        var g5 = e.entries[d3], u2 = t2.entries[d3];
        (!u2 || g5.timestamp.getTime() != u2.timestamp.getTime()) && (o4.push(d3), a2++);
      });
      var s4 = [];
      if (Object.keys(t2.entries).forEach((d3) => {
        e.entries[d3] || (s4.push(d3), a2++);
      }), !a2)
        return r(null);
      var l3 = false, _3 = e.type === "remote" ? e.db : t2.db, n3 = _3.transaction([IDBFS.DB_STORE_NAME], "readwrite"), m5 = n3.objectStore(IDBFS.DB_STORE_NAME);
      function p4(d3) {
        if (d3 && !l3)
          return l3 = true, r(d3);
      }
      n3.onerror = n3.onabort = (d3) => {
        p4(d3.target.error), d3.preventDefault();
      }, n3.oncomplete = (d3) => {
        l3 || r(null);
      }, o4.sort().forEach((d3) => {
        t2.type === "local" ? IDBFS.loadRemoteEntry(m5, d3, (g5, u2) => {
          if (g5)
            return p4(g5);
          IDBFS.storeLocalEntry(d3, u2, p4);
        }) : IDBFS.loadLocalEntry(d3, (g5, u2) => {
          if (g5)
            return p4(g5);
          IDBFS.storeRemoteEntry(m5, d3, u2, p4);
        });
      }), s4.sort().reverse().forEach((d3) => {
        t2.type === "local" ? IDBFS.removeLocalEntry(d3, p4) : IDBFS.removeRemoteEntry(m5, d3, p4);
      });
    } }, ERRNO_CODES = { EPERM: 63, ENOENT: 44, ESRCH: 71, EINTR: 27, EIO: 29, ENXIO: 60, E2BIG: 1, ENOEXEC: 45, EBADF: 8, ECHILD: 12, EAGAIN: 6, EWOULDBLOCK: 6, ENOMEM: 48, EACCES: 2, EFAULT: 21, ENOTBLK: 105, EBUSY: 10, EEXIST: 20, EXDEV: 75, ENODEV: 43, ENOTDIR: 54, EISDIR: 31, EINVAL: 28, ENFILE: 41, EMFILE: 33, ENOTTY: 59, ETXTBSY: 74, EFBIG: 22, ENOSPC: 51, ESPIPE: 70, EROFS: 69, EMLINK: 34, EPIPE: 64, EDOM: 18, ERANGE: 68, ENOMSG: 49, EIDRM: 24, ECHRNG: 106, EL2NSYNC: 156, EL3HLT: 107, EL3RST: 108, ELNRNG: 109, EUNATCH: 110, ENOCSI: 111, EL2HLT: 112, EDEADLK: 16, ENOLCK: 46, EBADE: 113, EBADR: 114, EXFULL: 115, ENOANO: 104, EBADRQC: 103, EBADSLT: 102, EDEADLOCK: 16, EBFONT: 101, ENOSTR: 100, ENODATA: 116, ETIME: 117, ENOSR: 118, ENONET: 119, ENOPKG: 120, EREMOTE: 121, ENOLINK: 47, EADV: 122, ESRMNT: 123, ECOMM: 124, EPROTO: 65, EMULTIHOP: 36, EDOTDOT: 125, EBADMSG: 9, ENOTUNIQ: 126, EBADFD: 127, EREMCHG: 128, ELIBACC: 129, ELIBBAD: 130, ELIBSCN: 131, ELIBMAX: 132, ELIBEXEC: 133, ENOSYS: 52, ENOTEMPTY: 55, ENAMETOOLONG: 37, ELOOP: 32, EOPNOTSUPP: 138, EPFNOSUPPORT: 139, ECONNRESET: 15, ENOBUFS: 42, EAFNOSUPPORT: 5, EPROTOTYPE: 67, ENOTSOCK: 57, ENOPROTOOPT: 50, ESHUTDOWN: 140, ECONNREFUSED: 14, EADDRINUSE: 3, ECONNABORTED: 13, ENETUNREACH: 40, ENETDOWN: 38, ETIMEDOUT: 73, EHOSTDOWN: 142, EHOSTUNREACH: 23, EINPROGRESS: 26, EALREADY: 7, EDESTADDRREQ: 17, EMSGSIZE: 35, EPROTONOSUPPORT: 66, ESOCKTNOSUPPORT: 137, EADDRNOTAVAIL: 4, ENETRESET: 39, EISCONN: 30, ENOTCONN: 53, ETOOMANYREFS: 141, EUSERS: 136, EDQUOT: 19, ESTALE: 72, ENOTSUP: 138, ENOMEDIUM: 148, EILSEQ: 25, EOVERFLOW: 61, ECANCELED: 11, ENOTRECOVERABLE: 56, EOWNERDEAD: 62, ESTRPIPE: 135 }, NODEFS = { isWindows: false, staticInit() {
      NODEFS.isWindows = !!process.platform.match(/^win/);
      var e = process.binding("constants");
      e.fs && (e = e.fs), NODEFS.flagsForNodeMap = { 1024: e.O_APPEND, 64: e.O_CREAT, 128: e.O_EXCL, 256: e.O_NOCTTY, 0: e.O_RDONLY, 2: e.O_RDWR, 4096: e.O_SYNC, 512: e.O_TRUNC, 1: e.O_WRONLY, 131072: e.O_NOFOLLOW };
    }, convertNodeCode(e) {
      var t2 = e.code;
      return ERRNO_CODES[t2];
    }, tryFSOperation(e) {
      try {
        return e();
      } catch (t2) {
        throw t2.code ? t2.code === "UNKNOWN" ? new FS.ErrnoError(28) : new FS.ErrnoError(NODEFS.convertNodeCode(t2)) : t2;
      }
    }, mount(e) {
      return NODEFS.createNode(null, "/", NODEFS.getMode(e.opts.root), 0);
    }, createNode(e, t2, r, a2) {
      if (!FS.isDir(r) && !FS.isFile(r) && !FS.isLink(r))
        throw new FS.ErrnoError(28);
      var o4 = FS.createNode(e, t2, r);
      return o4.node_ops = NODEFS.node_ops, o4.stream_ops = NODEFS.stream_ops, o4;
    }, getMode(e) {
      return NODEFS.tryFSOperation(() => {
        var t2 = fs.lstatSync(e).mode;
        return NODEFS.isWindows && (t2 |= (t2 & 292) >> 2), t2;
      });
    }, realPath(e) {
      for (var t2 = [];e.parent !== e; )
        t2.push(e.name), e = e.parent;
      return t2.push(e.mount.opts.root), t2.reverse(), PATH.join(...t2);
    }, flagsForNode(e) {
      e &= -2097153, e &= -2049, e &= -32769, e &= -524289, e &= -65537;
      var t2 = 0;
      for (var r in NODEFS.flagsForNodeMap)
        e & r && (t2 |= NODEFS.flagsForNodeMap[r], e ^= r);
      if (e)
        throw new FS.ErrnoError(28);
      return t2;
    }, node_ops: { getattr(e) {
      var t2 = NODEFS.realPath(e), r;
      return NODEFS.tryFSOperation(() => r = fs.lstatSync(t2)), NODEFS.isWindows && (r.blksize || (r.blksize = 4096), r.blocks || (r.blocks = (r.size + r.blksize - 1) / r.blksize | 0), r.mode |= (r.mode & 292) >> 2), { dev: r.dev, ino: r.ino, mode: r.mode, nlink: r.nlink, uid: r.uid, gid: r.gid, rdev: r.rdev, size: r.size, atime: r.atime, mtime: r.mtime, ctime: r.ctime, blksize: r.blksize, blocks: r.blocks };
    }, setattr(e, t2) {
      var r = NODEFS.realPath(e);
      NODEFS.tryFSOperation(() => {
        if (t2.mode !== undefined) {
          var a2 = t2.mode;
          NODEFS.isWindows && (a2 &= 384), fs.chmodSync(r, a2), e.mode = t2.mode;
        }
        if (t2.atime || t2.mtime) {
          var o4 = t2.atime && new Date(t2.atime), s4 = t2.mtime && new Date(t2.mtime);
          fs.utimesSync(r, o4, s4);
        }
        t2.size !== undefined && fs.truncateSync(r, t2.size);
      });
    }, lookup(e, t2) {
      var r = PATH.join2(NODEFS.realPath(e), t2), a2 = NODEFS.getMode(r);
      return NODEFS.createNode(e, t2, a2);
    }, mknod(e, t2, r, a2) {
      var o4 = NODEFS.createNode(e, t2, r, a2), s4 = NODEFS.realPath(o4);
      return NODEFS.tryFSOperation(() => {
        FS.isDir(o4.mode) ? fs.mkdirSync(s4, o4.mode) : fs.writeFileSync(s4, "", { mode: o4.mode });
      }), o4;
    }, rename(e, t2, r) {
      var a2 = NODEFS.realPath(e), o4 = PATH.join2(NODEFS.realPath(t2), r);
      try {
        FS.unlink(o4);
      } catch {
      }
      NODEFS.tryFSOperation(() => fs.renameSync(a2, o4)), e.name = r;
    }, unlink(e, t2) {
      var r = PATH.join2(NODEFS.realPath(e), t2);
      NODEFS.tryFSOperation(() => fs.unlinkSync(r));
    }, rmdir(e, t2) {
      var r = PATH.join2(NODEFS.realPath(e), t2);
      NODEFS.tryFSOperation(() => fs.rmdirSync(r));
    }, readdir(e) {
      var t2 = NODEFS.realPath(e);
      return NODEFS.tryFSOperation(() => fs.readdirSync(t2));
    }, symlink(e, t2, r) {
      var a2 = PATH.join2(NODEFS.realPath(e), t2);
      NODEFS.tryFSOperation(() => fs.symlinkSync(r, a2));
    }, readlink(e) {
      var t2 = NODEFS.realPath(e);
      return NODEFS.tryFSOperation(() => fs.readlinkSync(t2));
    }, statfs(e) {
      var t2 = NODEFS.tryFSOperation(() => fs.statfsSync(e));
      return t2.frsize = t2.bsize, t2;
    } }, stream_ops: { open(e) {
      var t2 = NODEFS.realPath(e.node);
      NODEFS.tryFSOperation(() => {
        FS.isFile(e.node.mode) && (e.shared.refcount = 1, e.nfd = fs.openSync(t2, NODEFS.flagsForNode(e.flags)));
      });
    }, close(e) {
      NODEFS.tryFSOperation(() => {
        FS.isFile(e.node.mode) && e.nfd && --e.shared.refcount === 0 && fs.closeSync(e.nfd);
      });
    }, dup(e) {
      e.shared.refcount++;
    }, read(e, t2, r, a2, o4) {
      return a2 === 0 ? 0 : NODEFS.tryFSOperation(() => fs.readSync(e.nfd, new Int8Array(t2.buffer, r, a2), 0, a2, o4));
    }, write(e, t2, r, a2, o4) {
      return NODEFS.tryFSOperation(() => fs.writeSync(e.nfd, new Int8Array(t2.buffer, r, a2), 0, a2, o4));
    }, llseek(e, t2, r) {
      var a2 = t2;
      if (r === 1 ? a2 += e.position : r === 2 && FS.isFile(e.node.mode) && NODEFS.tryFSOperation(() => {
        var o4 = fs.fstatSync(e.nfd);
        a2 += o4.size;
      }), a2 < 0)
        throw new FS.ErrnoError(28);
      return a2;
    }, mmap(e, t2, r, a2, o4) {
      if (!FS.isFile(e.node.mode))
        throw new FS.ErrnoError(43);
      var s4 = mmapAlloc(t2);
      return NODEFS.stream_ops.read(e, HEAP8, s4, t2, r), { ptr: s4, allocated: true };
    }, msync(e, t2, r, a2, o4) {
      return NODEFS.stream_ops.write(e, t2, 0, a2, r, false), 0;
    } } }, FS = { root: null, mounts: [], devices: {}, streams: [], nextInode: 1, nameTable: null, currentPath: "/", initialized: false, ignorePermissions: true, ErrnoError: class {
      constructor(e) {
        P(this, "name", "ErrnoError");
        this.errno = e;
      }
    }, filesystems: null, syncFSRequests: 0, readFiles: {}, FSStream: class {
      constructor() {
        P(this, "shared", {});
      }
      get object() {
        return this.node;
      }
      set object(e) {
        this.node = e;
      }
      get isRead() {
        return (this.flags & 2097155) !== 1;
      }
      get isWrite() {
        return (this.flags & 2097155) !== 0;
      }
      get isAppend() {
        return this.flags & 1024;
      }
      get flags() {
        return this.shared.flags;
      }
      set flags(e) {
        this.shared.flags = e;
      }
      get position() {
        return this.shared.position;
      }
      set position(e) {
        this.shared.position = e;
      }
    }, FSNode: class {
      constructor(e, t2, r, a2) {
        P(this, "node_ops", {});
        P(this, "stream_ops", {});
        P(this, "readMode", 365);
        P(this, "writeMode", 146);
        P(this, "mounted", null);
        e || (e = this), this.parent = e, this.mount = e.mount, this.id = FS.nextInode++, this.name = t2, this.mode = r, this.rdev = a2, this.atime = this.mtime = this.ctime = Date.now();
      }
      get read() {
        return (this.mode & this.readMode) === this.readMode;
      }
      set read(e) {
        e ? this.mode |= this.readMode : this.mode &= ~this.readMode;
      }
      get write() {
        return (this.mode & this.writeMode) === this.writeMode;
      }
      set write(e) {
        e ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
      }
      get isFolder() {
        return FS.isDir(this.mode);
      }
      get isDevice() {
        return FS.isChrdev(this.mode);
      }
    }, lookupPath(e, t2 = {}) {
      if (!e)
        return { path: "", node: null };
      t2.follow_mount ?? (t2.follow_mount = true), PATH.isAbs(e) || (e = FS.cwd() + "/" + e);
      e:
        for (var r = 0;r < 40; r++) {
          for (var a2 = e.split("/").filter((m5) => !!m5 && m5 !== "."), o4 = FS.root, s4 = "/", l3 = 0;l3 < a2.length; l3++) {
            var _3 = l3 === a2.length - 1;
            if (_3 && t2.parent)
              break;
            if (a2[l3] === "..") {
              s4 = PATH.dirname(s4), o4 = o4.parent;
              continue;
            }
            s4 = PATH.join2(s4, a2[l3]);
            try {
              o4 = FS.lookupNode(o4, a2[l3]);
            } catch (m5) {
              if (m5?.errno === 44 && _3 && t2.noent_okay)
                return { path: s4 };
              throw m5;
            }
            if (FS.isMountpoint(o4) && (!_3 || t2.follow_mount) && (o4 = o4.mounted.root), FS.isLink(o4.mode) && (!_3 || t2.follow)) {
              if (!o4.node_ops.readlink)
                throw new FS.ErrnoError(52);
              var n3 = o4.node_ops.readlink(o4);
              PATH.isAbs(n3) || (n3 = PATH.dirname(s4) + "/" + n3), e = n3 + "/" + a2.slice(l3 + 1).join("/");
              continue e;
            }
          }
          return { path: s4, node: o4 };
        }
      throw new FS.ErrnoError(32);
    }, getPath(e) {
      for (var t2;; ) {
        if (FS.isRoot(e)) {
          var r = e.mount.mountpoint;
          return t2 ? r[r.length - 1] !== "/" ? `${r}/${t2}` : r + t2 : r;
        }
        t2 = t2 ? `${e.name}/${t2}` : e.name, e = e.parent;
      }
    }, hashName(e, t2) {
      for (var r = 0, a2 = 0;a2 < t2.length; a2++)
        r = (r << 5) - r + t2.charCodeAt(a2) | 0;
      return (e + r >>> 0) % FS.nameTable.length;
    }, hashAddNode(e) {
      var t2 = FS.hashName(e.parent.id, e.name);
      e.name_next = FS.nameTable[t2], FS.nameTable[t2] = e;
    }, hashRemoveNode(e) {
      var t2 = FS.hashName(e.parent.id, e.name);
      if (FS.nameTable[t2] === e)
        FS.nameTable[t2] = e.name_next;
      else
        for (var r = FS.nameTable[t2];r; ) {
          if (r.name_next === e) {
            r.name_next = e.name_next;
            break;
          }
          r = r.name_next;
        }
    }, lookupNode(e, t2) {
      var r = FS.mayLookup(e);
      if (r)
        throw new FS.ErrnoError(r);
      for (var a2 = FS.hashName(e.id, t2), o4 = FS.nameTable[a2];o4; o4 = o4.name_next) {
        var s4 = o4.name;
        if (o4.parent.id === e.id && s4 === t2)
          return o4;
      }
      return FS.lookup(e, t2);
    }, createNode(e, t2, r, a2) {
      var o4 = new FS.FSNode(e, t2, r, a2);
      return FS.hashAddNode(o4), o4;
    }, destroyNode(e) {
      FS.hashRemoveNode(e);
    }, isRoot(e) {
      return e === e.parent;
    }, isMountpoint(e) {
      return !!e.mounted;
    }, isFile(e) {
      return (e & 61440) === 32768;
    }, isDir(e) {
      return (e & 61440) === 16384;
    }, isLink(e) {
      return (e & 61440) === 40960;
    }, isChrdev(e) {
      return (e & 61440) === 8192;
    }, isBlkdev(e) {
      return (e & 61440) === 24576;
    }, isFIFO(e) {
      return (e & 61440) === 4096;
    }, isSocket(e) {
      return (e & 49152) === 49152;
    }, flagsToPermissionString(e) {
      var t2 = ["r", "w", "rw"][e & 3];
      return e & 512 && (t2 += "w"), t2;
    }, nodePermissions(e, t2) {
      return FS.ignorePermissions ? 0 : t2.includes("r") && !(e.mode & 292) || t2.includes("w") && !(e.mode & 146) || t2.includes("x") && !(e.mode & 73) ? 2 : 0;
    }, mayLookup(e) {
      if (!FS.isDir(e.mode))
        return 54;
      var t2 = FS.nodePermissions(e, "x");
      return t2 || (e.node_ops.lookup ? 0 : 2);
    }, mayCreate(e, t2) {
      if (!FS.isDir(e.mode))
        return 54;
      try {
        var r = FS.lookupNode(e, t2);
        return 20;
      } catch {
      }
      return FS.nodePermissions(e, "wx");
    }, mayDelete(e, t2, r) {
      var a2;
      try {
        a2 = FS.lookupNode(e, t2);
      } catch (s4) {
        return s4.errno;
      }
      var o4 = FS.nodePermissions(e, "wx");
      if (o4)
        return o4;
      if (r) {
        if (!FS.isDir(a2.mode))
          return 54;
        if (FS.isRoot(a2) || FS.getPath(a2) === FS.cwd())
          return 10;
      } else if (FS.isDir(a2.mode))
        return 31;
      return 0;
    }, mayOpen(e, t2) {
      return e ? FS.isLink(e.mode) ? 32 : FS.isDir(e.mode) && (FS.flagsToPermissionString(t2) !== "r" || t2 & 512) ? 31 : FS.nodePermissions(e, FS.flagsToPermissionString(t2)) : 44;
    }, MAX_OPEN_FDS: 4096, nextfd() {
      for (var e = 0;e <= FS.MAX_OPEN_FDS; e++)
        if (!FS.streams[e])
          return e;
      throw new FS.ErrnoError(33);
    }, getStreamChecked(e) {
      var t2 = FS.getStream(e);
      if (!t2)
        throw new FS.ErrnoError(8);
      return t2;
    }, getStream: (e) => FS.streams[e], createStream(e, t2 = -1) {
      return e = Object.assign(new FS.FSStream, e), t2 == -1 && (t2 = FS.nextfd()), e.fd = t2, FS.streams[t2] = e, e;
    }, closeStream(e) {
      FS.streams[e] = null;
    }, dupStream(e, t2 = -1) {
      var r = FS.createStream(e, t2);
      return r.stream_ops?.dup?.(r), r;
    }, chrdev_stream_ops: { open(e) {
      var t2 = FS.getDevice(e.node.rdev);
      e.stream_ops = t2.stream_ops, e.stream_ops.open?.(e);
    }, llseek() {
      throw new FS.ErrnoError(70);
    } }, major: (e) => e >> 8, minor: (e) => e & 255, makedev: (e, t2) => e << 8 | t2, registerDevice(e, t2) {
      FS.devices[e] = { stream_ops: t2 };
    }, getDevice: (e) => FS.devices[e], getMounts(e) {
      for (var t2 = [], r = [e];r.length; ) {
        var a2 = r.pop();
        t2.push(a2), r.push(...a2.mounts);
      }
      return t2;
    }, syncfs(e, t2) {
      typeof e == "function" && (t2 = e, e = false), FS.syncFSRequests++, FS.syncFSRequests > 1 && err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
      var r = FS.getMounts(FS.root.mount), a2 = 0;
      function o4(l3) {
        return FS.syncFSRequests--, t2(l3);
      }
      function s4(l3) {
        if (l3)
          return s4.errored ? undefined : (s4.errored = true, o4(l3));
        ++a2 >= r.length && o4(null);
      }
      r.forEach((l3) => {
        if (!l3.type.syncfs)
          return s4(null);
        l3.type.syncfs(l3, e, s4);
      });
    }, mount(e, t2, r) {
      var a2 = r === "/", o4 = !r, s4;
      if (a2 && FS.root)
        throw new FS.ErrnoError(10);
      if (!a2 && !o4) {
        var l3 = FS.lookupPath(r, { follow_mount: false });
        if (r = l3.path, s4 = l3.node, FS.isMountpoint(s4))
          throw new FS.ErrnoError(10);
        if (!FS.isDir(s4.mode))
          throw new FS.ErrnoError(54);
      }
      var _3 = { type: e, opts: t2, mountpoint: r, mounts: [] }, n3 = e.mount(_3);
      return n3.mount = _3, _3.root = n3, a2 ? FS.root = n3 : s4 && (s4.mounted = _3, s4.mount && s4.mount.mounts.push(_3)), n3;
    }, unmount(e) {
      var t2 = FS.lookupPath(e, { follow_mount: false });
      if (!FS.isMountpoint(t2.node))
        throw new FS.ErrnoError(28);
      var r = t2.node, a2 = r.mounted, o4 = FS.getMounts(a2);
      Object.keys(FS.nameTable).forEach((l3) => {
        for (var _3 = FS.nameTable[l3];_3; ) {
          var n3 = _3.name_next;
          o4.includes(_3.mount) && FS.destroyNode(_3), _3 = n3;
        }
      }), r.mounted = null;
      var s4 = r.mount.mounts.indexOf(a2);
      r.mount.mounts.splice(s4, 1);
    }, lookup(e, t2) {
      return e.node_ops.lookup(e, t2);
    }, mknod(e, t2, r) {
      var a2 = FS.lookupPath(e, { parent: true }), o4 = a2.node, s4 = PATH.basename(e);
      if (!s4 || s4 === "." || s4 === "..")
        throw new FS.ErrnoError(28);
      var l3 = FS.mayCreate(o4, s4);
      if (l3)
        throw new FS.ErrnoError(l3);
      if (!o4.node_ops.mknod)
        throw new FS.ErrnoError(63);
      return o4.node_ops.mknod(o4, s4, t2, r);
    }, statfs(e) {
      var t2 = { bsize: 4096, frsize: 4096, blocks: 1e6, bfree: 500000, bavail: 500000, files: FS.nextInode, ffree: FS.nextInode - 1, fsid: 42, flags: 2, namelen: 255 }, r = FS.lookupPath(e, { follow: true }).node;
      return r?.node_ops.statfs && Object.assign(t2, r.node_ops.statfs(r.mount.opts.root)), t2;
    }, create(e, t2 = 438) {
      return t2 &= 4095, t2 |= 32768, FS.mknod(e, t2, 0);
    }, mkdir(e, t2 = 511) {
      return t2 &= 1023, t2 |= 16384, FS.mknod(e, t2, 0);
    }, mkdirTree(e, t2) {
      for (var r = e.split("/"), a2 = "", o4 = 0;o4 < r.length; ++o4)
        if (r[o4]) {
          a2 += "/" + r[o4];
          try {
            FS.mkdir(a2, t2);
          } catch (s4) {
            if (s4.errno != 20)
              throw s4;
          }
        }
    }, mkdev(e, t2, r) {
      return typeof r > "u" && (r = t2, t2 = 438), t2 |= 8192, FS.mknod(e, t2, r);
    }, symlink(e, t2) {
      if (!PATH_FS.resolve(e))
        throw new FS.ErrnoError(44);
      var r = FS.lookupPath(t2, { parent: true }), a2 = r.node;
      if (!a2)
        throw new FS.ErrnoError(44);
      var o4 = PATH.basename(t2), s4 = FS.mayCreate(a2, o4);
      if (s4)
        throw new FS.ErrnoError(s4);
      if (!a2.node_ops.symlink)
        throw new FS.ErrnoError(63);
      return a2.node_ops.symlink(a2, o4, e);
    }, rename(e, t2) {
      var r = PATH.dirname(e), a2 = PATH.dirname(t2), o4 = PATH.basename(e), s4 = PATH.basename(t2), l3, _3, n3;
      if (l3 = FS.lookupPath(e, { parent: true }), _3 = l3.node, l3 = FS.lookupPath(t2, { parent: true }), n3 = l3.node, !_3 || !n3)
        throw new FS.ErrnoError(44);
      if (_3.mount !== n3.mount)
        throw new FS.ErrnoError(75);
      var m5 = FS.lookupNode(_3, o4), p4 = PATH_FS.relative(e, a2);
      if (p4.charAt(0) !== ".")
        throw new FS.ErrnoError(28);
      if (p4 = PATH_FS.relative(t2, r), p4.charAt(0) !== ".")
        throw new FS.ErrnoError(55);
      var d3;
      try {
        d3 = FS.lookupNode(n3, s4);
      } catch {
      }
      if (m5 !== d3) {
        var g5 = FS.isDir(m5.mode), u2 = FS.mayDelete(_3, o4, g5);
        if (u2)
          throw new FS.ErrnoError(u2);
        if (u2 = d3 ? FS.mayDelete(n3, s4, g5) : FS.mayCreate(n3, s4), u2)
          throw new FS.ErrnoError(u2);
        if (!_3.node_ops.rename)
          throw new FS.ErrnoError(63);
        if (FS.isMountpoint(m5) || d3 && FS.isMountpoint(d3))
          throw new FS.ErrnoError(10);
        if (n3 !== _3 && (u2 = FS.nodePermissions(_3, "w"), u2))
          throw new FS.ErrnoError(u2);
        FS.hashRemoveNode(m5);
        try {
          _3.node_ops.rename(m5, n3, s4), m5.parent = n3;
        } catch (f3) {
          throw f3;
        } finally {
          FS.hashAddNode(m5);
        }
      }
    }, rmdir(e) {
      var t2 = FS.lookupPath(e, { parent: true }), r = t2.node, a2 = PATH.basename(e), o4 = FS.lookupNode(r, a2), s4 = FS.mayDelete(r, a2, true);
      if (s4)
        throw new FS.ErrnoError(s4);
      if (!r.node_ops.rmdir)
        throw new FS.ErrnoError(63);
      if (FS.isMountpoint(o4))
        throw new FS.ErrnoError(10);
      r.node_ops.rmdir(r, a2), FS.destroyNode(o4);
    }, readdir(e) {
      var t2 = FS.lookupPath(e, { follow: true }), r = t2.node;
      if (!r.node_ops.readdir)
        throw new FS.ErrnoError(54);
      return r.node_ops.readdir(r);
    }, unlink(e) {
      var t2 = FS.lookupPath(e, { parent: true }), r = t2.node;
      if (!r)
        throw new FS.ErrnoError(44);
      var a2 = PATH.basename(e), o4 = FS.lookupNode(r, a2), s4 = FS.mayDelete(r, a2, false);
      if (s4)
        throw new FS.ErrnoError(s4);
      if (!r.node_ops.unlink)
        throw new FS.ErrnoError(63);
      if (FS.isMountpoint(o4))
        throw new FS.ErrnoError(10);
      r.node_ops.unlink(r, a2), FS.destroyNode(o4);
    }, readlink(e) {
      var t2 = FS.lookupPath(e), r = t2.node;
      if (!r)
        throw new FS.ErrnoError(44);
      if (!r.node_ops.readlink)
        throw new FS.ErrnoError(28);
      return r.node_ops.readlink(r);
    }, stat(e, t2) {
      var r = FS.lookupPath(e, { follow: !t2 }), a2 = r.node;
      if (!a2)
        throw new FS.ErrnoError(44);
      if (!a2.node_ops.getattr)
        throw new FS.ErrnoError(63);
      return a2.node_ops.getattr(a2);
    }, lstat(e) {
      return FS.stat(e, true);
    }, chmod(e, t2, r) {
      var a2;
      if (typeof e == "string") {
        var o4 = FS.lookupPath(e, { follow: !r });
        a2 = o4.node;
      } else
        a2 = e;
      if (!a2.node_ops.setattr)
        throw new FS.ErrnoError(63);
      a2.node_ops.setattr(a2, { mode: t2 & 4095 | a2.mode & -4096, ctime: Date.now() });
    }, lchmod(e, t2) {
      FS.chmod(e, t2, true);
    }, fchmod(e, t2) {
      var r = FS.getStreamChecked(e);
      FS.chmod(r.node, t2);
    }, chown(e, t2, r, a2) {
      var o4;
      if (typeof e == "string") {
        var s4 = FS.lookupPath(e, { follow: !a2 });
        o4 = s4.node;
      } else
        o4 = e;
      if (!o4.node_ops.setattr)
        throw new FS.ErrnoError(63);
      o4.node_ops.setattr(o4, { timestamp: Date.now() });
    }, lchown(e, t2, r) {
      FS.chown(e, t2, r, true);
    }, fchown(e, t2, r) {
      var a2 = FS.getStreamChecked(e);
      FS.chown(a2.node, t2, r);
    }, truncate(e, t2) {
      if (t2 < 0)
        throw new FS.ErrnoError(28);
      var r;
      if (typeof e == "string") {
        var a2 = FS.lookupPath(e, { follow: true });
        r = a2.node;
      } else
        r = e;
      if (!r.node_ops.setattr)
        throw new FS.ErrnoError(63);
      if (FS.isDir(r.mode))
        throw new FS.ErrnoError(31);
      if (!FS.isFile(r.mode))
        throw new FS.ErrnoError(28);
      var o4 = FS.nodePermissions(r, "w");
      if (o4)
        throw new FS.ErrnoError(o4);
      r.node_ops.setattr(r, { size: t2, timestamp: Date.now() });
    }, ftruncate(e, t2) {
      var r = FS.getStreamChecked(e);
      if (!(r.flags & 2097155))
        throw new FS.ErrnoError(28);
      FS.truncate(r.node, t2);
    }, utime(e, t2, r) {
      var a2 = FS.lookupPath(e, { follow: true }), o4 = a2.node;
      o4.node_ops.setattr(o4, { atime: t2, mtime: r });
    }, open(e, t2, r = 438) {
      if (e === "")
        throw new FS.ErrnoError(44);
      t2 = typeof t2 == "string" ? FS_modeStringToFlags(t2) : t2, t2 & 64 ? r = r & 4095 | 32768 : r = 0;
      var a2;
      if (typeof e == "object")
        a2 = e;
      else {
        var o4 = FS.lookupPath(e, { follow: !(t2 & 131072), noent_okay: true });
        a2 = o4.node, e = o4.path;
      }
      var s4 = false;
      if (t2 & 64)
        if (a2) {
          if (t2 & 128)
            throw new FS.ErrnoError(20);
        } else
          a2 = FS.mknod(e, r, 0), s4 = true;
      if (!a2)
        throw new FS.ErrnoError(44);
      if (FS.isChrdev(a2.mode) && (t2 &= -513), t2 & 65536 && !FS.isDir(a2.mode))
        throw new FS.ErrnoError(54);
      if (!s4) {
        var l3 = FS.mayOpen(a2, t2);
        if (l3)
          throw new FS.ErrnoError(l3);
      }
      t2 & 512 && !s4 && FS.truncate(a2, 0), t2 &= -131713;
      var _3 = FS.createStream({ node: a2, path: FS.getPath(a2), flags: t2, seekable: true, position: 0, stream_ops: a2.stream_ops, ungotten: [], error: false });
      return _3.stream_ops.open && _3.stream_ops.open(_3), Module.logReadFiles && !(t2 & 1) && ((e in FS.readFiles) || (FS.readFiles[e] = 1)), _3;
    }, close(e) {
      if (FS.isClosed(e))
        throw new FS.ErrnoError(8);
      e.getdents && (e.getdents = null);
      try {
        e.stream_ops.close && e.stream_ops.close(e);
      } catch (t2) {
        throw t2;
      } finally {
        FS.closeStream(e.fd);
      }
      e.fd = null;
    }, isClosed(e) {
      return e.fd === null;
    }, llseek(e, t2, r) {
      if (FS.isClosed(e))
        throw new FS.ErrnoError(8);
      if (!e.seekable || !e.stream_ops.llseek)
        throw new FS.ErrnoError(70);
      if (r != 0 && r != 1 && r != 2)
        throw new FS.ErrnoError(28);
      return e.position = e.stream_ops.llseek(e, t2, r), e.ungotten = [], e.position;
    }, read(e, t2, r, a2, o4) {
      if (a2 < 0 || o4 < 0)
        throw new FS.ErrnoError(28);
      if (FS.isClosed(e))
        throw new FS.ErrnoError(8);
      if ((e.flags & 2097155) === 1)
        throw new FS.ErrnoError(8);
      if (FS.isDir(e.node.mode))
        throw new FS.ErrnoError(31);
      if (!e.stream_ops.read)
        throw new FS.ErrnoError(28);
      var s4 = typeof o4 < "u";
      if (!s4)
        o4 = e.position;
      else if (!e.seekable)
        throw new FS.ErrnoError(70);
      var l3 = e.stream_ops.read(e, t2, r, a2, o4);
      return s4 || (e.position += l3), l3;
    }, write(e, t2, r, a2, o4, s4) {
      if (a2 < 0 || o4 < 0)
        throw new FS.ErrnoError(28);
      if (FS.isClosed(e))
        throw new FS.ErrnoError(8);
      if (!(e.flags & 2097155))
        throw new FS.ErrnoError(8);
      if (FS.isDir(e.node.mode))
        throw new FS.ErrnoError(31);
      if (!e.stream_ops.write)
        throw new FS.ErrnoError(28);
      e.seekable && e.flags & 1024 && FS.llseek(e, 0, 2);
      var l3 = typeof o4 < "u";
      if (!l3)
        o4 = e.position;
      else if (!e.seekable)
        throw new FS.ErrnoError(70);
      var _3 = e.stream_ops.write(e, t2, r, a2, o4, s4);
      return l3 || (e.position += _3), _3;
    }, allocate(e, t2, r) {
      if (FS.isClosed(e))
        throw new FS.ErrnoError(8);
      if (t2 < 0 || r <= 0)
        throw new FS.ErrnoError(28);
      if (!(e.flags & 2097155))
        throw new FS.ErrnoError(8);
      if (!FS.isFile(e.node.mode) && !FS.isDir(e.node.mode))
        throw new FS.ErrnoError(43);
      if (!e.stream_ops.allocate)
        throw new FS.ErrnoError(138);
      e.stream_ops.allocate(e, t2, r);
    }, mmap(e, t2, r, a2, o4) {
      if (a2 & 2 && !(o4 & 2) && (e.flags & 2097155) !== 2)
        throw new FS.ErrnoError(2);
      if ((e.flags & 2097155) === 1)
        throw new FS.ErrnoError(2);
      if (!e.stream_ops.mmap)
        throw new FS.ErrnoError(43);
      if (!t2)
        throw new FS.ErrnoError(28);
      return e.stream_ops.mmap(e, t2, r, a2, o4);
    }, msync(e, t2, r, a2, o4) {
      return e.stream_ops.msync ? e.stream_ops.msync(e, t2, r, a2, o4) : 0;
    }, ioctl(e, t2, r) {
      if (!e.stream_ops.ioctl)
        throw new FS.ErrnoError(59);
      return e.stream_ops.ioctl(e, t2, r);
    }, readFile(e, t2 = {}) {
      if (t2.flags = t2.flags || 0, t2.encoding = t2.encoding || "binary", t2.encoding !== "utf8" && t2.encoding !== "binary")
        throw new Error(`Invalid encoding type "${t2.encoding}"`);
      var r, a2 = FS.open(e, t2.flags), o4 = FS.stat(e), s4 = o4.size, l3 = new Uint8Array(s4);
      return FS.read(a2, l3, 0, s4, 0), t2.encoding === "utf8" ? r = UTF8ArrayToString(l3) : t2.encoding === "binary" && (r = l3), FS.close(a2), r;
    }, writeFile(e, t2, r = {}) {
      r.flags = r.flags || 577;
      var a2 = FS.open(e, r.flags, r.mode);
      if (typeof t2 == "string") {
        var o4 = new Uint8Array(lengthBytesUTF8(t2) + 1), s4 = stringToUTF8Array(t2, o4, 0, o4.length);
        FS.write(a2, o4, 0, s4, undefined, r.canOwn);
      } else if (ArrayBuffer.isView(t2))
        FS.write(a2, t2, 0, t2.byteLength, undefined, r.canOwn);
      else
        throw new Error("Unsupported data type");
      FS.close(a2);
    }, cwd: () => FS.currentPath, chdir(e) {
      var t2 = FS.lookupPath(e, { follow: true });
      if (t2.node === null)
        throw new FS.ErrnoError(44);
      if (!FS.isDir(t2.node.mode))
        throw new FS.ErrnoError(54);
      var r = FS.nodePermissions(t2.node, "x");
      if (r)
        throw new FS.ErrnoError(r);
      FS.currentPath = t2.path;
    }, createDefaultDirectories() {
      FS.mkdir("/tmp"), FS.mkdir("/home"), FS.mkdir("/home/web_user");
    }, createDefaultDevices() {
      FS.mkdir("/dev"), FS.registerDevice(FS.makedev(1, 3), { read: () => 0, write: (a2, o4, s4, l3, _3) => l3, llseek: () => 0 }), FS.mkdev("/dev/null", FS.makedev(1, 3)), TTY.register(FS.makedev(5, 0), TTY.default_tty_ops), TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops), FS.mkdev("/dev/tty", FS.makedev(5, 0)), FS.mkdev("/dev/tty1", FS.makedev(6, 0));
      var e = new Uint8Array(1024), t2 = 0, r = () => (t2 === 0 && (t2 = randomFill(e).byteLength), e[--t2]);
      FS.createDevice("/dev", "random", r), FS.createDevice("/dev", "urandom", r), FS.mkdir("/dev/shm"), FS.mkdir("/dev/shm/tmp");
    }, createSpecialDirectories() {
      FS.mkdir("/proc");
      var e = FS.mkdir("/proc/self");
      FS.mkdir("/proc/self/fd"), FS.mount({ mount() {
        var t2 = FS.createNode(e, "fd", 16895, 73);
        return t2.stream_ops = { llseek: MEMFS.stream_ops.llseek }, t2.node_ops = { lookup(r, a2) {
          var o4 = +a2, s4 = FS.getStreamChecked(o4), l3 = { parent: null, mount: { mountpoint: "fake" }, node_ops: { readlink: () => s4.path }, id: o4 + 1 };
          return l3.parent = l3, l3;
        }, readdir() {
          return Array.from(FS.streams.entries()).filter(([r, a2]) => a2).map(([r, a2]) => r.toString());
        } }, t2;
      } }, {}, "/proc/self/fd");
    }, createStandardStreams(e, t2, r) {
      e ? FS.createDevice("/dev", "stdin", e) : FS.symlink("/dev/tty", "/dev/stdin"), t2 ? FS.createDevice("/dev", "stdout", null, t2) : FS.symlink("/dev/tty", "/dev/stdout"), r ? FS.createDevice("/dev", "stderr", null, r) : FS.symlink("/dev/tty1", "/dev/stderr");
      var a2 = FS.open("/dev/stdin", 0), o4 = FS.open("/dev/stdout", 1), s4 = FS.open("/dev/stderr", 1);
    }, staticInit() {
      FS.nameTable = new Array(4096), FS.mount(MEMFS, {}, "/"), FS.createDefaultDirectories(), FS.createDefaultDevices(), FS.createSpecialDirectories(), FS.filesystems = { MEMFS, IDBFS, NODEFS };
    }, init(e, t2, r) {
      FS.initialized = true, e ?? (e = Module.stdin), t2 ?? (t2 = Module.stdout), r ?? (r = Module.stderr), FS.createStandardStreams(e, t2, r);
    }, quit() {
      FS.initialized = false, _fflush(0);
      for (var e = 0;e < FS.streams.length; e++) {
        var t2 = FS.streams[e];
        t2 && FS.close(t2);
      }
    }, findObject(e, t2) {
      var r = FS.analyzePath(e, t2);
      return r.exists ? r.object : null;
    }, analyzePath(e, t2) {
      try {
        var r = FS.lookupPath(e, { follow: !t2 });
        e = r.path;
      } catch {
      }
      var a2 = { isRoot: false, exists: false, error: 0, name: null, path: null, object: null, parentExists: false, parentPath: null, parentObject: null };
      try {
        var r = FS.lookupPath(e, { parent: true });
        a2.parentExists = true, a2.parentPath = r.path, a2.parentObject = r.node, a2.name = PATH.basename(e), r = FS.lookupPath(e, { follow: !t2 }), a2.exists = true, a2.path = r.path, a2.object = r.node, a2.name = r.node.name, a2.isRoot = r.path === "/";
      } catch (o4) {
        a2.error = o4.errno;
      }
      return a2;
    }, createPath(e, t2, r, a2) {
      e = typeof e == "string" ? e : FS.getPath(e);
      for (var o4 = t2.split("/").reverse();o4.length; ) {
        var s4 = o4.pop();
        if (s4) {
          var l3 = PATH.join2(e, s4);
          try {
            FS.mkdir(l3);
          } catch {
          }
          e = l3;
        }
      }
      return l3;
    }, createFile(e, t2, r, a2, o4) {
      var s4 = PATH.join2(typeof e == "string" ? e : FS.getPath(e), t2), l3 = FS_getMode(a2, o4);
      return FS.create(s4, l3);
    }, createDataFile(e, t2, r, a2, o4, s4) {
      var l3 = t2;
      e && (e = typeof e == "string" ? e : FS.getPath(e), l3 = t2 ? PATH.join2(e, t2) : e);
      var _3 = FS_getMode(a2, o4), n3 = FS.create(l3, _3);
      if (r) {
        if (typeof r == "string") {
          for (var m5 = new Array(r.length), p4 = 0, d3 = r.length;p4 < d3; ++p4)
            m5[p4] = r.charCodeAt(p4);
          r = m5;
        }
        FS.chmod(n3, _3 | 146);
        var g5 = FS.open(n3, 577);
        FS.write(g5, r, 0, r.length, 0, s4), FS.close(g5), FS.chmod(n3, _3);
      }
    }, createDevice(e, t2, r, a2) {
      var _3;
      var o4 = PATH.join2(typeof e == "string" ? e : FS.getPath(e), t2), s4 = FS_getMode(!!r, !!a2);
      (_3 = FS.createDevice).major ?? (_3.major = 64);
      var l3 = FS.makedev(FS.createDevice.major++, 0);
      return FS.registerDevice(l3, { open(n3) {
        n3.seekable = false;
      }, close(n3) {
        a2?.buffer?.length && a2(10);
      }, read(n3, m5, p4, d3, g5) {
        for (var u2 = 0, f3 = 0;f3 < d3; f3++) {
          var c2;
          try {
            c2 = r();
          } catch {
            throw new FS.ErrnoError(29);
          }
          if (c2 === undefined && u2 === 0)
            throw new FS.ErrnoError(6);
          if (c2 == null)
            break;
          u2++, m5[p4 + f3] = c2;
        }
        return u2 && (n3.node.atime = Date.now()), u2;
      }, write(n3, m5, p4, d3, g5) {
        for (var u2 = 0;u2 < d3; u2++)
          try {
            a2(m5[p4 + u2]);
          } catch {
            throw new FS.ErrnoError(29);
          }
        return d3 && (n3.node.mtime = n3.node.ctime = Date.now()), u2;
      } }), FS.mkdev(o4, s4, l3);
    }, forceLoadFile(e) {
      if (e.isDevice || e.isFolder || e.link || e.contents)
        return true;
      if (typeof XMLHttpRequest < "u")
        throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
      try {
        e.contents = readBinary(e.url), e.usedBytes = e.contents.length;
      } catch {
        throw new FS.ErrnoError(29);
      }
    }, createLazyFile(e, t2, r, a2, o4) {

      class s4 {
        constructor() {
          P(this, "lengthKnown", false);
          P(this, "chunks", []);
        }
        get(u2) {
          if (!(u2 > this.length - 1 || u2 < 0)) {
            var f3 = u2 % this.chunkSize, c2 = u2 / this.chunkSize | 0;
            return this.getter(c2)[f3];
          }
        }
        setDataGetter(u2) {
          this.getter = u2;
        }
        cacheLength() {
          var u2 = new XMLHttpRequest;
          if (u2.open("HEAD", r, false), u2.send(null), !(u2.status >= 200 && u2.status < 300 || u2.status === 304))
            throw new Error("Couldn't load " + r + ". Status: " + u2.status);
          var f3 = Number(u2.getResponseHeader("Content-length")), c2, w4 = (c2 = u2.getResponseHeader("Accept-Ranges")) && c2 === "bytes", v3 = (c2 = u2.getResponseHeader("Content-Encoding")) && c2 === "gzip", S3 = 1048576;
          w4 || (S3 = f3);
          var x6 = (M3, E3) => {
            if (M3 > E3)
              throw new Error("invalid range (" + M3 + ", " + E3 + ") or no bytes requested!");
            if (E3 > f3 - 1)
              throw new Error("only " + f3 + " bytes available! programmer error!");
            var b3 = new XMLHttpRequest;
            if (b3.open("GET", r, false), f3 !== S3 && b3.setRequestHeader("Range", "bytes=" + M3 + "-" + E3), b3.responseType = "arraybuffer", b3.overrideMimeType && b3.overrideMimeType("text/plain; charset=x-user-defined"), b3.send(null), !(b3.status >= 200 && b3.status < 300 || b3.status === 304))
              throw new Error("Couldn't load " + r + ". Status: " + b3.status);
            return b3.response !== undefined ? new Uint8Array(b3.response || []) : intArrayFromString(b3.responseText || "", true);
          }, y4 = this;
          y4.setDataGetter((M3) => {
            var E3 = M3 * S3, b3 = (M3 + 1) * S3 - 1;
            if (b3 = Math.min(b3, f3 - 1), typeof y4.chunks[M3] > "u" && (y4.chunks[M3] = x6(E3, b3)), typeof y4.chunks[M3] > "u")
              throw new Error("doXHR failed!");
            return y4.chunks[M3];
          }), (v3 || !f3) && (S3 = f3 = 1, f3 = this.getter(0).length, S3 = f3, out("LazyFiles on gzip forces download of the whole file when length is accessed")), this._length = f3, this._chunkSize = S3, this.lengthKnown = true;
        }
        get length() {
          return this.lengthKnown || this.cacheLength(), this._length;
        }
        get chunkSize() {
          return this.lengthKnown || this.cacheLength(), this._chunkSize;
        }
      }
      if (typeof XMLHttpRequest < "u") {
        if (!ENVIRONMENT_IS_WORKER)
          throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
        var l3 = new s4, _3 = { isDevice: false, contents: l3 };
      } else
        var _3 = { isDevice: false, url: r };
      var n3 = FS.createFile(e, t2, _3, a2, o4);
      _3.contents ? n3.contents = _3.contents : _3.url && (n3.contents = null, n3.url = _3.url), Object.defineProperties(n3, { usedBytes: { get: function() {
        return this.contents.length;
      } } });
      var m5 = {}, p4 = Object.keys(n3.stream_ops);
      p4.forEach((g5) => {
        var u2 = n3.stream_ops[g5];
        m5[g5] = (...f3) => (FS.forceLoadFile(n3), u2(...f3));
      });
      function d3(g5, u2, f3, c2, w4) {
        var v3 = g5.node.contents;
        if (w4 >= v3.length)
          return 0;
        var S3 = Math.min(v3.length - w4, c2);
        if (v3.slice)
          for (var x6 = 0;x6 < S3; x6++)
            u2[f3 + x6] = v3[w4 + x6];
        else
          for (var x6 = 0;x6 < S3; x6++)
            u2[f3 + x6] = v3.get(w4 + x6);
        return S3;
      }
      return m5.read = (g5, u2, f3, c2, w4) => (FS.forceLoadFile(n3), d3(g5, u2, f3, c2, w4)), m5.mmap = (g5, u2, f3, c2, w4) => {
        FS.forceLoadFile(n3);
        var v3 = mmapAlloc(u2);
        if (!v3)
          throw new FS.ErrnoError(48);
        return d3(g5, HEAP8, v3, u2, f3), { ptr: v3, allocated: true };
      }, n3.stream_ops = m5, n3;
    } }, SYSCALLS = { DEFAULT_POLLMASK: 5, calculateAt(e, t2, r) {
      if (PATH.isAbs(t2))
        return t2;
      var a2;
      if (e === -100)
        a2 = FS.cwd();
      else {
        var o4 = SYSCALLS.getStreamFromFD(e);
        a2 = o4.path;
      }
      if (t2.length == 0) {
        if (!r)
          throw new FS.ErrnoError(44);
        return a2;
      }
      return a2 + "/" + t2;
    }, doStat(e, t2, r) {
      var a2 = e(t2);
      HEAP32[r >> 2] = a2.dev, HEAP32[r + 4 >> 2] = a2.mode, HEAPU32[r + 8 >> 2] = a2.nlink, HEAP32[r + 12 >> 2] = a2.uid, HEAP32[r + 16 >> 2] = a2.gid, HEAP32[r + 20 >> 2] = a2.rdev, HEAP64[r + 24 >> 3] = BigInt(a2.size), HEAP32[r + 32 >> 2] = 4096, HEAP32[r + 36 >> 2] = a2.blocks;
      var o4 = a2.atime.getTime(), s4 = a2.mtime.getTime(), l3 = a2.ctime.getTime();
      return HEAP64[r + 40 >> 3] = BigInt(Math.floor(o4 / 1000)), HEAPU32[r + 48 >> 2] = o4 % 1000 * 1000 * 1000, HEAP64[r + 56 >> 3] = BigInt(Math.floor(s4 / 1000)), HEAPU32[r + 64 >> 2] = s4 % 1000 * 1000 * 1000, HEAP64[r + 72 >> 3] = BigInt(Math.floor(l3 / 1000)), HEAPU32[r + 80 >> 2] = l3 % 1000 * 1000 * 1000, HEAP64[r + 88 >> 3] = BigInt(a2.ino), 0;
    }, doMsync(e, t2, r, a2, o4) {
      if (!FS.isFile(t2.node.mode))
        throw new FS.ErrnoError(43);
      if (a2 & 2)
        return 0;
      var s4 = HEAPU8.slice(e, e + r);
      FS.msync(t2, s4, o4, r, a2);
    }, getStreamFromFD(e) {
      var t2 = FS.getStreamChecked(e);
      return t2;
    }, varargs: undefined, getStr(e) {
      var t2 = UTF8ToString(e);
      return t2;
    } }, ___syscall__newselect = function(e, t2, r, a2, o4) {
      try {
        for (var s4 = 0, l3 = t2 ? HEAP32[t2 >> 2] : 0, _3 = t2 ? HEAP32[t2 + 4 >> 2] : 0, n3 = r ? HEAP32[r >> 2] : 0, m5 = r ? HEAP32[r + 4 >> 2] : 0, p4 = a2 ? HEAP32[a2 >> 2] : 0, d3 = a2 ? HEAP32[a2 + 4 >> 2] : 0, g5 = 0, u2 = 0, f3 = 0, c2 = 0, w4 = 0, v3 = 0, S3 = (t2 ? HEAP32[t2 >> 2] : 0) | (r ? HEAP32[r >> 2] : 0) | (a2 ? HEAP32[a2 >> 2] : 0), x6 = (t2 ? HEAP32[t2 + 4 >> 2] : 0) | (r ? HEAP32[r + 4 >> 2] : 0) | (a2 ? HEAP32[a2 + 4 >> 2] : 0), y4 = (N2, P4, R3, k2) => N2 < 32 ? P4 & k2 : R3 & k2, M3 = 0;M3 < e; M3++) {
          var E3 = 1 << M3 % 32;
          if (y4(M3, S3, x6, E3)) {
            var b3 = SYSCALLS.getStreamFromFD(M3), U3 = SYSCALLS.DEFAULT_POLLMASK;
            if (b3.stream_ops.poll) {
              var z2 = -1;
              if (o4) {
                var W3 = t2 ? HEAP32[o4 >> 2] : 0, D4 = t2 ? HEAP32[o4 + 4 >> 2] : 0;
                z2 = (W3 + D4 / 1e6) * 1000;
              }
              U3 = b3.stream_ops.poll(b3, z2);
            }
            U3 & 1 && y4(M3, l3, _3, E3) && (M3 < 32 ? g5 = g5 | E3 : u2 = u2 | E3, s4++), U3 & 4 && y4(M3, n3, m5, E3) && (M3 < 32 ? f3 = f3 | E3 : c2 = c2 | E3, s4++), U3 & 2 && y4(M3, p4, d3, E3) && (M3 < 32 ? w4 = w4 | E3 : v3 = v3 | E3, s4++);
          }
        }
        return t2 && (HEAP32[t2 >> 2] = g5, HEAP32[t2 + 4 >> 2] = u2), r && (HEAP32[r >> 2] = f3, HEAP32[r + 4 >> 2] = c2), a2 && (HEAP32[a2 >> 2] = w4, HEAP32[a2 + 4 >> 2] = v3), s4;
      } catch (N2) {
        if (typeof FS > "u" || N2.name !== "ErrnoError")
          throw N2;
        return -N2.errno;
      }
    };
    ___syscall__newselect.sig = "iipppp";
    var SOCKFS = { websocketArgs: {}, callbacks: {}, on(e, t2) {
      SOCKFS.callbacks[e] = t2;
    }, emit(e, t2) {
      SOCKFS.callbacks[e]?.(t2);
    }, mount(e) {
      return SOCKFS.websocketArgs = Module.websocket || {}, (Module.websocket ?? (Module.websocket = {})).on = SOCKFS.on, FS.createNode(null, "/", 16895, 0);
    }, createSocket(e, t2, r) {
      t2 &= -526337;
      var a2 = t2 == 1;
      if (a2 && r && r != 6)
        throw new FS.ErrnoError(66);
      var o4 = { family: e, type: t2, protocol: r, server: null, error: null, peers: {}, pending: [], recv_queue: [], sock_ops: SOCKFS.websocket_sock_ops }, s4 = SOCKFS.nextname(), l3 = FS.createNode(SOCKFS.root, s4, 49152, 0);
      l3.sock = o4;
      var _3 = FS.createStream({ path: s4, node: l3, flags: 2, seekable: false, stream_ops: SOCKFS.stream_ops });
      return o4.stream = _3, o4;
    }, getSocket(e) {
      var t2 = FS.getStream(e);
      return !t2 || !FS.isSocket(t2.node.mode) ? null : t2.node.sock;
    }, stream_ops: { poll(e) {
      var t2 = e.node.sock;
      return t2.sock_ops.poll(t2);
    }, ioctl(e, t2, r) {
      var a2 = e.node.sock;
      return a2.sock_ops.ioctl(a2, t2, r);
    }, read(e, t2, r, a2, o4) {
      var s4 = e.node.sock, l3 = s4.sock_ops.recvmsg(s4, a2);
      return l3 ? (t2.set(l3.buffer, r), l3.buffer.length) : 0;
    }, write(e, t2, r, a2, o4) {
      var s4 = e.node.sock;
      return s4.sock_ops.sendmsg(s4, t2, r, a2);
    }, close(e) {
      var t2 = e.node.sock;
      t2.sock_ops.close(t2);
    } }, nextname() {
      return SOCKFS.nextname.current || (SOCKFS.nextname.current = 0), `socket[${SOCKFS.nextname.current++}]`;
    }, websocket_sock_ops: { createPeer(e, t2, r) {
      var a2;
      if (typeof t2 == "object" && (a2 = t2, t2 = null, r = null), a2)
        if (a2._socket)
          t2 = a2._socket.remoteAddress, r = a2._socket.remotePort;
        else {
          var o4 = /ws[s]?:\/\/([^:]+):(\d+)/.exec(a2.url);
          if (!o4)
            throw new Error("WebSocket URL must be in the format ws(s)://address:port");
          t2 = o4[1], r = parseInt(o4[2], 10);
        }
      else
        try {
          var s4 = "ws:#".replace("#", "//"), l3 = "binary", _3 = undefined;
          if (SOCKFS.websocketArgs.url && (s4 = SOCKFS.websocketArgs.url), SOCKFS.websocketArgs.subprotocol ? l3 = SOCKFS.websocketArgs.subprotocol : SOCKFS.websocketArgs.subprotocol === null && (l3 = "null"), s4 === "ws://" || s4 === "wss://") {
            var n3 = t2.split("/");
            s4 = s4 + n3[0] + ":" + r + "/" + n3.slice(1).join("/");
          }
          l3 !== "null" && (l3 = l3.replace(/^ +| +$/g, "").split(/ *, */), _3 = l3);
          var m5;
          ENVIRONMENT_IS_NODE ? m5 = require("ws") : m5 = WebSocket, a2 = new m5(s4, _3), a2.binaryType = "arraybuffer";
        } catch {
          throw new FS.ErrnoError(23);
        }
      var p4 = { addr: t2, port: r, socket: a2, msg_send_queue: [] };
      return SOCKFS.websocket_sock_ops.addPeer(e, p4), SOCKFS.websocket_sock_ops.handlePeerEvents(e, p4), e.type === 2 && typeof e.sport < "u" && p4.msg_send_queue.push(new Uint8Array([255, 255, 255, 255, 112, 111, 114, 116, (e.sport & 65280) >> 8, e.sport & 255])), p4;
    }, getPeer(e, t2, r) {
      return e.peers[t2 + ":" + r];
    }, addPeer(e, t2) {
      e.peers[t2.addr + ":" + t2.port] = t2;
    }, removePeer(e, t2) {
      delete e.peers[t2.addr + ":" + t2.port];
    }, handlePeerEvents(e, t2) {
      var r = true, a2 = function() {
        e.connecting = false, SOCKFS.emit("open", e.stream.fd);
        try {
          for (var s4 = t2.msg_send_queue.shift();s4; )
            t2.socket.send(s4), s4 = t2.msg_send_queue.shift();
        } catch {
          t2.socket.close();
        }
      };
      function o4(s4) {
        if (typeof s4 == "string") {
          var l3 = new TextEncoder;
          s4 = l3.encode(s4);
        } else {
          if (assert(s4.byteLength !== undefined), s4.byteLength == 0)
            return;
          s4 = new Uint8Array(s4);
        }
        var _3 = r;
        if (r = false, _3 && s4.length === 10 && s4[0] === 255 && s4[1] === 255 && s4[2] === 255 && s4[3] === 255 && s4[4] === 112 && s4[5] === 111 && s4[6] === 114 && s4[7] === 116) {
          var n3 = s4[8] << 8 | s4[9];
          SOCKFS.websocket_sock_ops.removePeer(e, t2), t2.port = n3, SOCKFS.websocket_sock_ops.addPeer(e, t2);
          return;
        }
        e.recv_queue.push({ addr: t2.addr, port: t2.port, data: s4 }), SOCKFS.emit("message", e.stream.fd);
      }
      ENVIRONMENT_IS_NODE ? (t2.socket.on("open", a2), t2.socket.on("message", function(s4, l3) {
        l3 && o4(new Uint8Array(s4).buffer);
      }), t2.socket.on("close", function() {
        SOCKFS.emit("close", e.stream.fd);
      }), t2.socket.on("error", function(s4) {
        e.error = 14, SOCKFS.emit("error", [e.stream.fd, e.error, "ECONNREFUSED: Connection refused"]);
      })) : (t2.socket.onopen = a2, t2.socket.onclose = function() {
        SOCKFS.emit("close", e.stream.fd);
      }, t2.socket.onmessage = function(l3) {
        o4(l3.data);
      }, t2.socket.onerror = function(s4) {
        e.error = 14, SOCKFS.emit("error", [e.stream.fd, e.error, "ECONNREFUSED: Connection refused"]);
      });
    }, poll(e) {
      if (e.type === 1 && e.server)
        return e.pending.length ? 65 : 0;
      var t2 = 0, r = e.type === 1 ? SOCKFS.websocket_sock_ops.getPeer(e, e.daddr, e.dport) : null;
      return (e.recv_queue.length || !r || r && r.socket.readyState === r.socket.CLOSING || r && r.socket.readyState === r.socket.CLOSED) && (t2 |= 65), (!r || r && r.socket.readyState === r.socket.OPEN) && (t2 |= 4), (r && r.socket.readyState === r.socket.CLOSING || r && r.socket.readyState === r.socket.CLOSED) && (e.connecting ? t2 |= 4 : t2 |= 16), t2;
    }, ioctl(e, t2, r) {
      switch (t2) {
        case 21531:
          var a2 = 0;
          return e.recv_queue.length && (a2 = e.recv_queue[0].data.length), HEAP32[r >> 2] = a2, 0;
        default:
          return 28;
      }
    }, close(e) {
      if (e.server) {
        try {
          e.server.close();
        } catch {
        }
        e.server = null;
      }
      for (var t2 = Object.keys(e.peers), r = 0;r < t2.length; r++) {
        var a2 = e.peers[t2[r]];
        try {
          a2.socket.close();
        } catch {
        }
        SOCKFS.websocket_sock_ops.removePeer(e, a2);
      }
      return 0;
    }, bind(e, t2, r) {
      if (typeof e.saddr < "u" || typeof e.sport < "u")
        throw new FS.ErrnoError(28);
      if (e.saddr = t2, e.sport = r, e.type === 2) {
        e.server && (e.server.close(), e.server = null);
        try {
          e.sock_ops.listen(e, 0);
        } catch (a2) {
          if (a2.name !== "ErrnoError" || a2.errno !== 138)
            throw a2;
        }
      }
    }, connect(e, t2, r) {
      if (e.server)
        throw new FS.ErrnoError(138);
      if (typeof e.daddr < "u" && typeof e.dport < "u") {
        var a2 = SOCKFS.websocket_sock_ops.getPeer(e, e.daddr, e.dport);
        if (a2)
          throw a2.socket.readyState === a2.socket.CONNECTING ? new FS.ErrnoError(7) : new FS.ErrnoError(30);
      }
      var o4 = SOCKFS.websocket_sock_ops.createPeer(e, t2, r);
      e.daddr = o4.addr, e.dport = o4.port, e.connecting = true;
    }, listen(e, t2) {
      if (!ENVIRONMENT_IS_NODE)
        throw new FS.ErrnoError(138);
      if (e.server)
        throw new FS.ErrnoError(28);
      var r = require("ws").Server, a2 = e.saddr;
      e.server = new r({ host: a2, port: e.sport }), SOCKFS.emit("listen", e.stream.fd), e.server.on("connection", function(o4) {
        if (e.type === 1) {
          var s4 = SOCKFS.createSocket(e.family, e.type, e.protocol), l3 = SOCKFS.websocket_sock_ops.createPeer(s4, o4);
          s4.daddr = l3.addr, s4.dport = l3.port, e.pending.push(s4), SOCKFS.emit("connection", s4.stream.fd);
        } else
          SOCKFS.websocket_sock_ops.createPeer(e, o4), SOCKFS.emit("connection", e.stream.fd);
      }), e.server.on("close", function() {
        SOCKFS.emit("close", e.stream.fd), e.server = null;
      }), e.server.on("error", function(o4) {
        e.error = 23, SOCKFS.emit("error", [e.stream.fd, e.error, "EHOSTUNREACH: Host is unreachable"]);
      });
    }, accept(e) {
      if (!e.server || !e.pending.length)
        throw new FS.ErrnoError(28);
      var t2 = e.pending.shift();
      return t2.stream.flags = e.stream.flags, t2;
    }, getname(e, t2) {
      var r, a2;
      if (t2) {
        if (e.daddr === undefined || e.dport === undefined)
          throw new FS.ErrnoError(53);
        r = e.daddr, a2 = e.dport;
      } else
        r = e.saddr || 0, a2 = e.sport || 0;
      return { addr: r, port: a2 };
    }, sendmsg(e, t2, r, a2, o4, s4) {
      if (e.type === 2) {
        if ((o4 === undefined || s4 === undefined) && (o4 = e.daddr, s4 = e.dport), o4 === undefined || s4 === undefined)
          throw new FS.ErrnoError(17);
      } else
        o4 = e.daddr, s4 = e.dport;
      var l3 = SOCKFS.websocket_sock_ops.getPeer(e, o4, s4);
      if (e.type === 1 && (!l3 || l3.socket.readyState === l3.socket.CLOSING || l3.socket.readyState === l3.socket.CLOSED))
        throw new FS.ErrnoError(53);
      ArrayBuffer.isView(t2) && (r += t2.byteOffset, t2 = t2.buffer);
      var _3 = t2.slice(r, r + a2);
      if (!l3 || l3.socket.readyState !== l3.socket.OPEN)
        return e.type === 2 && (!l3 || l3.socket.readyState === l3.socket.CLOSING || l3.socket.readyState === l3.socket.CLOSED) && (l3 = SOCKFS.websocket_sock_ops.createPeer(e, o4, s4)), l3.msg_send_queue.push(_3), a2;
      try {
        return l3.socket.send(_3), a2;
      } catch {
        throw new FS.ErrnoError(28);
      }
    }, recvmsg(e, t2) {
      if (e.type === 1 && e.server)
        throw new FS.ErrnoError(53);
      var r = e.recv_queue.shift();
      if (!r) {
        if (e.type === 1) {
          var a2 = SOCKFS.websocket_sock_ops.getPeer(e, e.daddr, e.dport);
          if (!a2)
            throw new FS.ErrnoError(53);
          if (a2.socket.readyState === a2.socket.CLOSING || a2.socket.readyState === a2.socket.CLOSED)
            return null;
          throw new FS.ErrnoError(6);
        }
        throw new FS.ErrnoError(6);
      }
      var o4 = r.data.byteLength || r.data.length, s4 = r.data.byteOffset || 0, l3 = r.data.buffer || r.data, _3 = Math.min(t2, o4), n3 = { buffer: new Uint8Array(l3, s4, _3), addr: r.addr, port: r.port };
      if (e.type === 1 && _3 < o4) {
        var m5 = o4 - _3;
        r.data = new Uint8Array(l3, s4 + _3, m5), e.recv_queue.unshift(r);
      }
      return n3;
    } } }, getSocketFromFD = (e) => {
      var t2 = SOCKFS.getSocket(e);
      if (!t2)
        throw new FS.ErrnoError(8);
      return t2;
    }, inetPton4 = (e) => {
      for (var t2 = e.split("."), r = 0;r < 4; r++) {
        var a2 = Number(t2[r]);
        if (isNaN(a2))
          return null;
        t2[r] = a2;
      }
      return (t2[0] | t2[1] << 8 | t2[2] << 16 | t2[3] << 24) >>> 0;
    }, jstoi_q = (e) => parseInt(e), inetPton6 = (e) => {
      var t2, r, a2, o4, s4 = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i, l3 = [];
      if (!s4.test(e))
        return null;
      if (e === "::")
        return [0, 0, 0, 0, 0, 0, 0, 0];
      for (e.startsWith("::") ? e = e.replace("::", "Z:") : e = e.replace("::", ":Z:"), e.indexOf(".") > 0 ? (e = e.replace(new RegExp("[.]", "g"), ":"), t2 = e.split(":"), t2[t2.length - 4] = jstoi_q(t2[t2.length - 4]) + jstoi_q(t2[t2.length - 3]) * 256, t2[t2.length - 3] = jstoi_q(t2[t2.length - 2]) + jstoi_q(t2[t2.length - 1]) * 256, t2 = t2.slice(0, t2.length - 2)) : t2 = e.split(":"), a2 = 0, o4 = 0, r = 0;r < t2.length; r++)
        if (typeof t2[r] == "string")
          if (t2[r] === "Z") {
            for (o4 = 0;o4 < 8 - t2.length + 1; o4++)
              l3[r + o4] = 0;
            a2 = o4 - 1;
          } else
            l3[r + a2] = _htons(parseInt(t2[r], 16));
        else
          l3[r + a2] = t2[r];
      return [l3[1] << 16 | l3[0], l3[3] << 16 | l3[2], l3[5] << 16 | l3[4], l3[7] << 16 | l3[6]];
    }, writeSockaddr = (e, t2, r, a2, o4) => {
      switch (t2) {
        case 2:
          r = inetPton4(r), zeroMemory(e, 16), o4 && (HEAP32[o4 >> 2] = 16), HEAP16[e >> 1] = t2, HEAP32[e + 4 >> 2] = r, HEAP16[e + 2 >> 1] = _htons(a2);
          break;
        case 10:
          r = inetPton6(r), zeroMemory(e, 28), o4 && (HEAP32[o4 >> 2] = 28), HEAP32[e >> 2] = t2, HEAP32[e + 8 >> 2] = r[0], HEAP32[e + 12 >> 2] = r[1], HEAP32[e + 16 >> 2] = r[2], HEAP32[e + 20 >> 2] = r[3], HEAP16[e + 2 >> 1] = _htons(a2);
          break;
        default:
          return 5;
      }
      return 0;
    }, DNS = { address_map: { id: 1, addrs: {}, names: {} }, lookup_name(e) {
      var t2 = inetPton4(e);
      if (t2 !== null || (t2 = inetPton6(e), t2 !== null))
        return e;
      var r;
      if (DNS.address_map.addrs[e])
        r = DNS.address_map.addrs[e];
      else {
        var a2 = DNS.address_map.id++;
        assert(a2 < 65535, "exceeded max address mappings of 65535"), r = "172.29." + (a2 & 255) + "." + (a2 & 65280), DNS.address_map.names[r] = e, DNS.address_map.addrs[e] = r;
      }
      return r;
    }, lookup_addr(e) {
      return DNS.address_map.names[e] ? DNS.address_map.names[e] : null;
    } };
    function ___syscall_accept4(e, t2, r, a2, o4, s4) {
      try {
        var l3 = getSocketFromFD(e), _3 = l3.sock_ops.accept(l3);
        if (t2)
          var n3 = writeSockaddr(t2, _3.family, DNS.lookup_name(_3.daddr), _3.dport, r);
        return _3.stream.fd;
      } catch (m5) {
        if (typeof FS > "u" || m5.name !== "ErrnoError")
          throw m5;
        return -m5.errno;
      }
    }
    ___syscall_accept4.sig = "iippiii";
    var inetNtop4 = (e) => (e & 255) + "." + (e >> 8 & 255) + "." + (e >> 16 & 255) + "." + (e >> 24 & 255), inetNtop6 = (e) => {
      var t2 = "", r = 0, a2 = 0, o4 = 0, s4 = 0, l3 = 0, _3 = 0, n3 = [e[0] & 65535, e[0] >> 16, e[1] & 65535, e[1] >> 16, e[2] & 65535, e[2] >> 16, e[3] & 65535, e[3] >> 16], m5 = true, p4 = "";
      for (_3 = 0;_3 < 5; _3++)
        if (n3[_3] !== 0) {
          m5 = false;
          break;
        }
      if (m5) {
        if (p4 = inetNtop4(n3[6] | n3[7] << 16), n3[5] === -1)
          return t2 = "::ffff:", t2 += p4, t2;
        if (n3[5] === 0)
          return t2 = "::", p4 === "0.0.0.0" && (p4 = ""), p4 === "0.0.0.1" && (p4 = "1"), t2 += p4, t2;
      }
      for (r = 0;r < 8; r++)
        n3[r] === 0 && (r - o4 > 1 && (l3 = 0), o4 = r, l3++), l3 > a2 && (a2 = l3, s4 = r - a2 + 1);
      for (r = 0;r < 8; r++) {
        if (a2 > 1 && n3[r] === 0 && r >= s4 && r < s4 + a2) {
          r === s4 && (t2 += ":", s4 === 0 && (t2 += ":"));
          continue;
        }
        t2 += Number(_ntohs(n3[r] & 65535)).toString(16), t2 += r < 7 ? ":" : "";
      }
      return t2;
    }, readSockaddr = (e, t2) => {
      var r = HEAP16[e >> 1], a2 = _ntohs(HEAPU16[e + 2 >> 1]), o4;
      switch (r) {
        case 2:
          if (t2 !== 16)
            return { errno: 28 };
          o4 = HEAP32[e + 4 >> 2], o4 = inetNtop4(o4);
          break;
        case 10:
          if (t2 !== 28)
            return { errno: 28 };
          o4 = [HEAP32[e + 8 >> 2], HEAP32[e + 12 >> 2], HEAP32[e + 16 >> 2], HEAP32[e + 20 >> 2]], o4 = inetNtop6(o4);
          break;
        default:
          return { errno: 5 };
      }
      return { family: r, addr: o4, port: a2 };
    }, getSocketAddress = (e, t2) => {
      var r = readSockaddr(e, t2);
      if (r.errno)
        throw new FS.ErrnoError(r.errno);
      return r.addr = DNS.lookup_addr(r.addr) || r.addr, r;
    };
    function ___syscall_bind(e, t2, r, a2, o4, s4) {
      try {
        var l3 = getSocketFromFD(e), _3 = getSocketAddress(t2, r);
        return l3.sock_ops.bind(l3, _3.addr, _3.port), 0;
      } catch (n3) {
        if (typeof FS > "u" || n3.name !== "ErrnoError")
          throw n3;
        return -n3.errno;
      }
    }
    ___syscall_bind.sig = "iippiii";
    function ___syscall_chdir(e) {
      try {
        return e = SYSCALLS.getStr(e), FS.chdir(e), 0;
      } catch (t2) {
        if (typeof FS > "u" || t2.name !== "ErrnoError")
          throw t2;
        return -t2.errno;
      }
    }
    ___syscall_chdir.sig = "ip";
    function ___syscall_chmod(e, t2) {
      try {
        return e = SYSCALLS.getStr(e), FS.chmod(e, t2), 0;
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError")
          throw r;
        return -r.errno;
      }
    }
    ___syscall_chmod.sig = "ipi";
    function ___syscall_connect(e, t2, r, a2, o4, s4) {
      try {
        var l3 = getSocketFromFD(e), _3 = getSocketAddress(t2, r);
        return l3.sock_ops.connect(l3, _3.addr, _3.port), 0;
      } catch (n3) {
        if (typeof FS > "u" || n3.name !== "ErrnoError")
          throw n3;
        return -n3.errno;
      }
    }
    ___syscall_connect.sig = "iippiii";
    function ___syscall_dup(e) {
      try {
        var t2 = SYSCALLS.getStreamFromFD(e);
        return FS.dupStream(t2).fd;
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError")
          throw r;
        return -r.errno;
      }
    }
    ___syscall_dup.sig = "ii";
    function ___syscall_dup3(e, t2, r) {
      try {
        var a2 = SYSCALLS.getStreamFromFD(e);
        if (a2.fd === t2)
          return -28;
        if (t2 < 0 || t2 >= FS.MAX_OPEN_FDS)
          return -8;
        var o4 = FS.getStream(t2);
        return o4 && FS.close(o4), FS.dupStream(a2, t2).fd;
      } catch (s4) {
        if (typeof FS > "u" || s4.name !== "ErrnoError")
          throw s4;
        return -s4.errno;
      }
    }
    ___syscall_dup3.sig = "iiii";
    function ___syscall_faccessat(e, t2, r, a2) {
      try {
        if (t2 = SYSCALLS.getStr(t2), t2 = SYSCALLS.calculateAt(e, t2), r & -8)
          return -28;
        var o4 = FS.lookupPath(t2, { follow: true }), s4 = o4.node;
        if (!s4)
          return -44;
        var l3 = "";
        return r & 4 && (l3 += "r"), r & 2 && (l3 += "w"), r & 1 && (l3 += "x"), l3 && FS.nodePermissions(s4, l3) ? -2 : 0;
      } catch (_3) {
        if (typeof FS > "u" || _3.name !== "ErrnoError")
          throw _3;
        return -_3.errno;
      }
    }
    ___syscall_faccessat.sig = "iipii";
    var ___syscall_fadvise64 = (e, t2, r, a2) => 0;
    ___syscall_fadvise64.sig = "iijji";
    var INT53_MAX = 9007199254740992, INT53_MIN = -9007199254740992, bigintToI53Checked = (e) => e < INT53_MIN || e > INT53_MAX ? NaN : Number(e);
    function ___syscall_fallocate(e, t2, r, a2) {
      r = bigintToI53Checked(r), a2 = bigintToI53Checked(a2);
      try {
        if (isNaN(r))
          return 61;
        var o4 = SYSCALLS.getStreamFromFD(e);
        return FS.allocate(o4, r, a2), 0;
      } catch (s4) {
        if (typeof FS > "u" || s4.name !== "ErrnoError")
          throw s4;
        return -s4.errno;
      }
    }
    ___syscall_fallocate.sig = "iiijj";
    var syscallGetVarargI = () => {
      var e = HEAP32[+SYSCALLS.varargs >> 2];
      return SYSCALLS.varargs += 4, e;
    }, syscallGetVarargP = syscallGetVarargI;
    function ___syscall_fcntl64(e, t2, r) {
      SYSCALLS.varargs = r;
      try {
        var a2 = SYSCALLS.getStreamFromFD(e);
        switch (t2) {
          case 0: {
            var o4 = syscallGetVarargI();
            if (o4 < 0)
              return -28;
            for (;FS.streams[o4]; )
              o4++;
            var s4;
            return s4 = FS.dupStream(a2, o4), s4.fd;
          }
          case 1:
          case 2:
            return 0;
          case 3:
            return a2.flags;
          case 4: {
            var o4 = syscallGetVarargI();
            return a2.flags |= o4, 0;
          }
          case 12: {
            var o4 = syscallGetVarargP(), l3 = 0;
            return HEAP16[o4 + l3 >> 1] = 2, 0;
          }
          case 13:
          case 14:
            return 0;
        }
        return -28;
      } catch (_3) {
        if (typeof FS > "u" || _3.name !== "ErrnoError")
          throw _3;
        return -_3.errno;
      }
    }
    ___syscall_fcntl64.sig = "iiip";
    function ___syscall_fdatasync(e) {
      try {
        var t2 = SYSCALLS.getStreamFromFD(e);
        return 0;
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError")
          throw r;
        return -r.errno;
      }
    }
    ___syscall_fdatasync.sig = "ii";
    function ___syscall_fstat64(e, t2) {
      try {
        var r = SYSCALLS.getStreamFromFD(e);
        return SYSCALLS.doStat(FS.stat, r.path, t2);
      } catch (a2) {
        if (typeof FS > "u" || a2.name !== "ErrnoError")
          throw a2;
        return -a2.errno;
      }
    }
    ___syscall_fstat64.sig = "iip";
    function ___syscall_ftruncate64(e, t2) {
      t2 = bigintToI53Checked(t2);
      try {
        return isNaN(t2) ? 61 : (FS.ftruncate(e, t2), 0);
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError")
          throw r;
        return -r.errno;
      }
    }
    ___syscall_ftruncate64.sig = "iij";
    var stringToUTF8 = (e, t2, r) => stringToUTF8Array(e, HEAPU8, t2, r);
    function ___syscall_getcwd(e, t2) {
      try {
        if (t2 === 0)
          return -28;
        var r = FS.cwd(), a2 = lengthBytesUTF8(r) + 1;
        return t2 < a2 ? -68 : (stringToUTF8(r, e, t2), a2);
      } catch (o4) {
        if (typeof FS > "u" || o4.name !== "ErrnoError")
          throw o4;
        return -o4.errno;
      }
    }
    ___syscall_getcwd.sig = "ipp";
    function ___syscall_getdents64(e, t2, r) {
      try {
        var a2 = SYSCALLS.getStreamFromFD(e);
        a2.getdents || (a2.getdents = FS.readdir(a2.path));
        for (var o4 = 280, s4 = 0, l3 = FS.llseek(a2, 0, 1), _3 = Math.floor(l3 / o4), n3 = Math.min(a2.getdents.length, _3 + Math.floor(r / o4)), m5 = _3;m5 < n3; m5++) {
          var p4, d3, g5 = a2.getdents[m5];
          if (g5 === ".")
            p4 = a2.node.id, d3 = 4;
          else if (g5 === "..") {
            var u2 = FS.lookupPath(a2.path, { parent: true });
            p4 = u2.node.id, d3 = 4;
          } else {
            var f3;
            try {
              f3 = FS.lookupNode(a2.node, g5);
            } catch (c2) {
              if (c2?.errno === 28)
                continue;
              throw c2;
            }
            p4 = f3.id, d3 = FS.isChrdev(f3.mode) ? 2 : FS.isDir(f3.mode) ? 4 : FS.isLink(f3.mode) ? 10 : 8;
          }
          HEAP64[t2 + s4 >> 3] = BigInt(p4), HEAP64[t2 + s4 + 8 >> 3] = BigInt((m5 + 1) * o4), HEAP16[t2 + s4 + 16 >> 1] = 280, HEAP8[t2 + s4 + 18] = d3, stringToUTF8(g5, t2 + s4 + 19, 256), s4 += o4;
        }
        return FS.llseek(a2, m5 * o4, 0), s4;
      } catch (c2) {
        if (typeof FS > "u" || c2.name !== "ErrnoError")
          throw c2;
        return -c2.errno;
      }
    }
    ___syscall_getdents64.sig = "iipp";
    function ___syscall_getsockname(e, t2, r, a2, o4, s4) {
      try {
        var l3 = getSocketFromFD(e), _3 = writeSockaddr(t2, l3.family, DNS.lookup_name(l3.saddr || "0.0.0.0"), l3.sport, r);
        return 0;
      } catch (n3) {
        if (typeof FS > "u" || n3.name !== "ErrnoError")
          throw n3;
        return -n3.errno;
      }
    }
    ___syscall_getsockname.sig = "iippiii";
    function ___syscall_getsockopt(e, t2, r, a2, o4, s4) {
      try {
        var l3 = getSocketFromFD(e);
        return t2 === 1 && r === 4 ? (HEAP32[a2 >> 2] = l3.error, HEAP32[o4 >> 2] = 4, l3.error = null, 0) : -50;
      } catch (_3) {
        if (typeof FS > "u" || _3.name !== "ErrnoError")
          throw _3;
        return -_3.errno;
      }
    }
    ___syscall_getsockopt.sig = "iiiippi";
    function ___syscall_ioctl(e, t2, r) {
      SYSCALLS.varargs = r;
      try {
        var a2 = SYSCALLS.getStreamFromFD(e);
        switch (t2) {
          case 21509:
            return a2.tty ? 0 : -59;
          case 21505: {
            if (!a2.tty)
              return -59;
            if (a2.tty.ops.ioctl_tcgets) {
              var o4 = a2.tty.ops.ioctl_tcgets(a2), s4 = syscallGetVarargP();
              HEAP32[s4 >> 2] = o4.c_iflag || 0, HEAP32[s4 + 4 >> 2] = o4.c_oflag || 0, HEAP32[s4 + 8 >> 2] = o4.c_cflag || 0, HEAP32[s4 + 12 >> 2] = o4.c_lflag || 0;
              for (var l3 = 0;l3 < 32; l3++)
                HEAP8[s4 + l3 + 17] = o4.c_cc[l3] || 0;
              return 0;
            }
            return 0;
          }
          case 21510:
          case 21511:
          case 21512:
            return a2.tty ? 0 : -59;
          case 21506:
          case 21507:
          case 21508: {
            if (!a2.tty)
              return -59;
            if (a2.tty.ops.ioctl_tcsets) {
              for (var s4 = syscallGetVarargP(), _3 = HEAP32[s4 >> 2], n3 = HEAP32[s4 + 4 >> 2], m5 = HEAP32[s4 + 8 >> 2], p4 = HEAP32[s4 + 12 >> 2], d3 = [], l3 = 0;l3 < 32; l3++)
                d3.push(HEAP8[s4 + l3 + 17]);
              return a2.tty.ops.ioctl_tcsets(a2.tty, t2, { c_iflag: _3, c_oflag: n3, c_cflag: m5, c_lflag: p4, c_cc: d3 });
            }
            return 0;
          }
          case 21519: {
            if (!a2.tty)
              return -59;
            var s4 = syscallGetVarargP();
            return HEAP32[s4 >> 2] = 0, 0;
          }
          case 21520:
            return a2.tty ? -28 : -59;
          case 21531: {
            var s4 = syscallGetVarargP();
            return FS.ioctl(a2, t2, s4);
          }
          case 21523: {
            if (!a2.tty)
              return -59;
            if (a2.tty.ops && a2.tty.ops.ioctl_tiocgwinsz) {
              var g5 = a2.tty.ops.ioctl_tiocgwinsz(a2.tty), s4 = syscallGetVarargP();
              HEAP16[s4 >> 1] = g5[0], HEAP16[s4 + 2 >> 1] = g5[1];
            }
            return 0;
          }
          case 21524:
            return a2.tty ? 0 : -59;
          case 21515:
            return a2.tty ? 0 : -59;
          default:
            return -28;
        }
      } catch (u2) {
        if (typeof FS > "u" || u2.name !== "ErrnoError")
          throw u2;
        return -u2.errno;
      }
    }
    ___syscall_ioctl.sig = "iiip";
    function ___syscall_listen(e, t2) {
      try {
        var r = getSocketFromFD(e);
        return r.sock_ops.listen(r, t2), 0;
      } catch (a2) {
        if (typeof FS > "u" || a2.name !== "ErrnoError")
          throw a2;
        return -a2.errno;
      }
    }
    ___syscall_listen.sig = "iiiiiii";
    function ___syscall_lstat64(e, t2) {
      try {
        return e = SYSCALLS.getStr(e), SYSCALLS.doStat(FS.lstat, e, t2);
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError")
          throw r;
        return -r.errno;
      }
    }
    ___syscall_lstat64.sig = "ipp";
    function ___syscall_mkdirat(e, t2, r) {
      try {
        return t2 = SYSCALLS.getStr(t2), t2 = SYSCALLS.calculateAt(e, t2), FS.mkdir(t2, r, 0), 0;
      } catch (a2) {
        if (typeof FS > "u" || a2.name !== "ErrnoError")
          throw a2;
        return -a2.errno;
      }
    }
    ___syscall_mkdirat.sig = "iipi";
    function ___syscall_newfstatat(e, t2, r, a2) {
      try {
        t2 = SYSCALLS.getStr(t2);
        var o4 = a2 & 256, s4 = a2 & 4096;
        return a2 = a2 & -6401, t2 = SYSCALLS.calculateAt(e, t2, s4), SYSCALLS.doStat(o4 ? FS.lstat : FS.stat, t2, r);
      } catch (l3) {
        if (typeof FS > "u" || l3.name !== "ErrnoError")
          throw l3;
        return -l3.errno;
      }
    }
    ___syscall_newfstatat.sig = "iippi";
    function ___syscall_openat(e, t2, r, a2) {
      SYSCALLS.varargs = a2;
      try {
        t2 = SYSCALLS.getStr(t2), t2 = SYSCALLS.calculateAt(e, t2);
        var o4 = a2 ? syscallGetVarargI() : 0;
        return FS.open(t2, r, o4).fd;
      } catch (s4) {
        if (typeof FS > "u" || s4.name !== "ErrnoError")
          throw s4;
        return -s4.errno;
      }
    }
    ___syscall_openat.sig = "iipip";
    var PIPEFS = { BUCKET_BUFFER_SIZE: 8192, mount(e) {
      return FS.createNode(null, "/", 16895, 0);
    }, createPipe() {
      var e = { buckets: [], refcnt: 2 };
      e.buckets.push({ buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE), offset: 0, roffset: 0 });
      var t2 = PIPEFS.nextname(), r = PIPEFS.nextname(), a2 = FS.createNode(PIPEFS.root, t2, 4096, 0), o4 = FS.createNode(PIPEFS.root, r, 4096, 0);
      a2.pipe = e, o4.pipe = e;
      var s4 = FS.createStream({ path: t2, node: a2, flags: 0, seekable: false, stream_ops: PIPEFS.stream_ops });
      a2.stream = s4;
      var l3 = FS.createStream({ path: r, node: o4, flags: 1, seekable: false, stream_ops: PIPEFS.stream_ops });
      return o4.stream = l3, { readable_fd: s4.fd, writable_fd: l3.fd };
    }, stream_ops: { poll(e) {
      var t2 = e.node.pipe;
      if ((e.flags & 2097155) === 1)
        return 260;
      if (t2.buckets.length > 0)
        for (var r = 0;r < t2.buckets.length; r++) {
          var a2 = t2.buckets[r];
          if (a2.offset - a2.roffset > 0)
            return 65;
        }
      return 0;
    }, ioctl(e, t2, r) {
      return 28;
    }, fsync(e) {
      return 28;
    }, read(e, t2, r, a2, o4) {
      for (var s4 = e.node.pipe, l3 = 0, _3 = 0;_3 < s4.buckets.length; _3++) {
        var n3 = s4.buckets[_3];
        l3 += n3.offset - n3.roffset;
      }
      var m5 = t2.subarray(r, r + a2);
      if (a2 <= 0)
        return 0;
      if (l3 == 0)
        throw new FS.ErrnoError(6);
      for (var p4 = Math.min(l3, a2), d3 = p4, g5 = 0, _3 = 0;_3 < s4.buckets.length; _3++) {
        var u2 = s4.buckets[_3], f3 = u2.offset - u2.roffset;
        if (p4 <= f3) {
          var c2 = u2.buffer.subarray(u2.roffset, u2.offset);
          p4 < f3 ? (c2 = c2.subarray(0, p4), u2.roffset += p4) : g5++, m5.set(c2);
          break;
        } else {
          var c2 = u2.buffer.subarray(u2.roffset, u2.offset);
          m5.set(c2), m5 = m5.subarray(c2.byteLength), p4 -= c2.byteLength, g5++;
        }
      }
      return g5 && g5 == s4.buckets.length && (g5--, s4.buckets[g5].offset = 0, s4.buckets[g5].roffset = 0), s4.buckets.splice(0, g5), d3;
    }, write(e, t2, r, a2, o4) {
      var s4 = e.node.pipe, l3 = t2.subarray(r, r + a2), _3 = l3.byteLength;
      if (_3 <= 0)
        return 0;
      var n3 = null;
      s4.buckets.length == 0 ? (n3 = { buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE), offset: 0, roffset: 0 }, s4.buckets.push(n3)) : n3 = s4.buckets[s4.buckets.length - 1], assert(n3.offset <= PIPEFS.BUCKET_BUFFER_SIZE);
      var m5 = PIPEFS.BUCKET_BUFFER_SIZE - n3.offset;
      if (m5 >= _3)
        return n3.buffer.set(l3, n3.offset), n3.offset += _3, _3;
      m5 > 0 && (n3.buffer.set(l3.subarray(0, m5), n3.offset), n3.offset += m5, l3 = l3.subarray(m5, l3.byteLength));
      for (var p4 = l3.byteLength / PIPEFS.BUCKET_BUFFER_SIZE | 0, d3 = l3.byteLength % PIPEFS.BUCKET_BUFFER_SIZE, g5 = 0;g5 < p4; g5++) {
        var u2 = { buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE), offset: PIPEFS.BUCKET_BUFFER_SIZE, roffset: 0 };
        s4.buckets.push(u2), u2.buffer.set(l3.subarray(0, PIPEFS.BUCKET_BUFFER_SIZE)), l3 = l3.subarray(PIPEFS.BUCKET_BUFFER_SIZE, l3.byteLength);
      }
      if (d3 > 0) {
        var u2 = { buffer: new Uint8Array(PIPEFS.BUCKET_BUFFER_SIZE), offset: l3.byteLength, roffset: 0 };
        s4.buckets.push(u2), u2.buffer.set(l3);
      }
      return _3;
    }, close(e) {
      var t2 = e.node.pipe;
      t2.refcnt--, t2.refcnt === 0 && (t2.buckets = null);
    } }, nextname() {
      return PIPEFS.nextname.current || (PIPEFS.nextname.current = 0), "pipe[" + PIPEFS.nextname.current++ + "]";
    } };
    function ___syscall_pipe(e) {
      try {
        if (e == 0)
          throw new FS.ErrnoError(21);
        var t2 = PIPEFS.createPipe();
        return HEAP32[e >> 2] = t2.readable_fd, HEAP32[e + 4 >> 2] = t2.writable_fd, 0;
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError")
          throw r;
        return -r.errno;
      }
    }
    ___syscall_pipe.sig = "ip";
    function ___syscall_poll(e, t2, r) {
      try {
        for (var a2 = 0, o4 = 0;o4 < t2; o4++) {
          var s4 = e + 8 * o4, l3 = HEAP32[s4 >> 2], _3 = HEAP16[s4 + 4 >> 1], n3 = 32, m5 = FS.getStream(l3);
          m5 && (n3 = SYSCALLS.DEFAULT_POLLMASK, m5.stream_ops.poll && (n3 = m5.stream_ops.poll(m5, -1))), n3 &= _3 | 8 | 16, n3 && a2++, HEAP16[s4 + 6 >> 1] = n3;
        }
        return a2;
      } catch (p4) {
        if (typeof FS > "u" || p4.name !== "ErrnoError")
          throw p4;
        return -p4.errno;
      }
    }
    ___syscall_poll.sig = "ipii";
    function ___syscall_readlinkat(e, t2, r, a2) {
      try {
        if (t2 = SYSCALLS.getStr(t2), t2 = SYSCALLS.calculateAt(e, t2), a2 <= 0)
          return -28;
        var o4 = FS.readlink(t2), s4 = Math.min(a2, lengthBytesUTF8(o4)), l3 = HEAP8[r + s4];
        return stringToUTF8(o4, r, a2 + 1), HEAP8[r + s4] = l3, s4;
      } catch (_3) {
        if (typeof FS > "u" || _3.name !== "ErrnoError")
          throw _3;
        return -_3.errno;
      }
    }
    ___syscall_readlinkat.sig = "iippp";
    function ___syscall_recvfrom(e, t2, r, a2, o4, s4) {
      try {
        var l3 = getSocketFromFD(e), _3 = l3.sock_ops.recvmsg(l3, r);
        if (!_3)
          return 0;
        if (o4)
          var n3 = writeSockaddr(o4, l3.family, DNS.lookup_name(_3.addr), _3.port, s4);
        return HEAPU8.set(_3.buffer, t2), _3.buffer.byteLength;
      } catch (m5) {
        if (typeof FS > "u" || m5.name !== "ErrnoError")
          throw m5;
        return -m5.errno;
      }
    }
    ___syscall_recvfrom.sig = "iippipp";
    function ___syscall_renameat(e, t2, r, a2) {
      try {
        return t2 = SYSCALLS.getStr(t2), a2 = SYSCALLS.getStr(a2), t2 = SYSCALLS.calculateAt(e, t2), a2 = SYSCALLS.calculateAt(r, a2), FS.rename(t2, a2), 0;
      } catch (o4) {
        if (typeof FS > "u" || o4.name !== "ErrnoError")
          throw o4;
        return -o4.errno;
      }
    }
    ___syscall_renameat.sig = "iipip";
    function ___syscall_rmdir(e) {
      try {
        return e = SYSCALLS.getStr(e), FS.rmdir(e), 0;
      } catch (t2) {
        if (typeof FS > "u" || t2.name !== "ErrnoError")
          throw t2;
        return -t2.errno;
      }
    }
    ___syscall_rmdir.sig = "ip";
    function ___syscall_sendto(e, t2, r, a2, o4, s4) {
      try {
        var l3 = getSocketFromFD(e);
        if (!o4)
          return FS.write(l3.stream, HEAP8, t2, r);
        var _3 = getSocketAddress(o4, s4);
        return l3.sock_ops.sendmsg(l3, HEAP8, t2, r, _3.addr, _3.port);
      } catch (n3) {
        if (typeof FS > "u" || n3.name !== "ErrnoError")
          throw n3;
        return -n3.errno;
      }
    }
    ___syscall_sendto.sig = "iippipp";
    function ___syscall_socket(e, t2, r) {
      try {
        var a2 = SOCKFS.createSocket(e, t2, r);
        return a2.stream.fd;
      } catch (o4) {
        if (typeof FS > "u" || o4.name !== "ErrnoError")
          throw o4;
        return -o4.errno;
      }
    }
    ___syscall_socket.sig = "iiiiiii";
    function ___syscall_stat64(e, t2) {
      try {
        return e = SYSCALLS.getStr(e), SYSCALLS.doStat(FS.stat, e, t2);
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError")
          throw r;
        return -r.errno;
      }
    }
    ___syscall_stat64.sig = "ipp";
    function ___syscall_symlinkat(e, t2, r) {
      try {
        return e = SYSCALLS.getStr(e), r = SYSCALLS.getStr(r), r = SYSCALLS.calculateAt(t2, r), FS.symlink(e, r), 0;
      } catch (a2) {
        if (typeof FS > "u" || a2.name !== "ErrnoError")
          throw a2;
        return -a2.errno;
      }
    }
    ___syscall_symlinkat.sig = "ipip";
    function ___syscall_truncate64(e, t2) {
      t2 = bigintToI53Checked(t2);
      try {
        return isNaN(t2) ? 61 : (e = SYSCALLS.getStr(e), FS.truncate(e, t2), 0);
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError")
          throw r;
        return -r.errno;
      }
    }
    ___syscall_truncate64.sig = "ipj";
    function ___syscall_unlinkat(e, t2, r) {
      try {
        return t2 = SYSCALLS.getStr(t2), t2 = SYSCALLS.calculateAt(e, t2), r === 0 ? FS.unlink(t2) : r === 512 ? FS.rmdir(t2) : abort("Invalid flags passed to unlinkat"), 0;
      } catch (a2) {
        if (typeof FS > "u" || a2.name !== "ErrnoError")
          throw a2;
        return -a2.errno;
      }
    }
    ___syscall_unlinkat.sig = "iipi";
    var ___table_base = new WebAssembly.Global({ value: "i32", mutable: false }, 1), __abort_js = () => abort("");
    __abort_js.sig = "v";
    var ENV = {}, stackAlloc = (e) => __emscripten_stack_alloc(e), stringToUTF8OnStack = (e) => {
      var t2 = lengthBytesUTF8(e) + 1, r = stackAlloc(t2);
      return stringToUTF8(e, r, t2), r;
    }, dlSetError = (e) => {
      var t2 = stackSave(), r = stringToUTF8OnStack(e);
      ___dl_seterr(r, 0), stackRestore(t2);
    }, dlopenInternal = (e, t2) => {
      var r = UTF8ToString(e + 36), a2 = HEAP32[e + 4 >> 2];
      r = PATH.normalize(r);
      var o4 = !!(a2 & 256), s4 = o4 ? null : {}, l3 = { global: o4, nodelete: !!(a2 & 4096), loadAsync: t2.loadAsync };
      if (t2.loadAsync)
        return loadDynamicLibrary(r, l3, s4, e);
      try {
        return loadDynamicLibrary(r, l3, s4, e);
      } catch (_3) {
        return dlSetError(`Could not load dynamic lib: ${r}
${_3}`), 0;
      }
    }, __dlopen_js = (e) => dlopenInternal(e, { loadAsync: false });
    __dlopen_js.sig = "pp";
    var __dlsym_js = (e, t2, r) => {
      t2 = UTF8ToString(t2);
      var a2, o4, s4 = LDSO.loadedLibsByHandle[e];
      if (!s4.exports.hasOwnProperty(t2) || s4.exports[t2].stub)
        return dlSetError(`Tried to lookup unknown symbol "${t2}" in dynamic lib: ${s4.name}`), 0;
      if (o4 = Object.keys(s4.exports).indexOf(t2), a2 = s4.exports[t2], typeof a2 == "function") {
        var l3 = getFunctionAddress(a2);
        l3 ? a2 = l3 : (a2 = addFunction(a2, a2.sig), HEAPU32[r >> 2] = o4);
      }
      return a2;
    };
    __dlsym_js.sig = "pppp";
    var getExecutableName = () => thisProgram || "./this.program", __emscripten_get_progname = (e, t2) => stringToUTF8(getExecutableName(), e, t2);
    __emscripten_get_progname.sig = "vpi";
    var __emscripten_lookup_name = (e) => {
      var t2 = UTF8ToString(e);
      return inetPton4(DNS.lookup_name(t2));
    };
    __emscripten_lookup_name.sig = "ip";
    var __emscripten_memcpy_js = (e, t2, r) => HEAPU8.copyWithin(e, t2, t2 + r);
    __emscripten_memcpy_js.sig = "vppp";
    var runtimeKeepaliveCounter = 0, __emscripten_runtime_keepalive_clear = () => {
      noExitRuntime = false, runtimeKeepaliveCounter = 0;
    };
    __emscripten_runtime_keepalive_clear.sig = "v";
    var __emscripten_system = (e) => {
      if (ENVIRONMENT_IS_NODE) {
        if (!e)
          return 1;
        var t2 = UTF8ToString(e);
        if (!t2.length)
          return 0;
        var r = require("child_process"), a2 = r.spawnSync(t2, [], { shell: true, stdio: "inherit" }), o4 = (l3, _3) => l3 << 8 | _3;
        if (a2.status === null) {
          var s4 = (l3) => {
            switch (l3) {
              case "SIGHUP":
                return 1;
              case "SIGQUIT":
                return 3;
              case "SIGFPE":
                return 8;
              case "SIGKILL":
                return 9;
              case "SIGALRM":
                return 14;
              case "SIGTERM":
                return 15;
              default:
                return 2;
            }
          };
          return o4(0, s4(a2.signal));
        }
        return o4(a2.status, 0);
      }
      return e ? -52 : 0;
    };
    __emscripten_system.sig = "ip";
    var __emscripten_throw_longjmp = () => {
      throw Infinity;
    };
    __emscripten_throw_longjmp.sig = "v";
    function __gmtime_js(e, t2) {
      e = bigintToI53Checked(e);
      var r = new Date(e * 1000);
      HEAP32[t2 >> 2] = r.getUTCSeconds(), HEAP32[t2 + 4 >> 2] = r.getUTCMinutes(), HEAP32[t2 + 8 >> 2] = r.getUTCHours(), HEAP32[t2 + 12 >> 2] = r.getUTCDate(), HEAP32[t2 + 16 >> 2] = r.getUTCMonth(), HEAP32[t2 + 20 >> 2] = r.getUTCFullYear() - 1900, HEAP32[t2 + 24 >> 2] = r.getUTCDay();
      var a2 = Date.UTC(r.getUTCFullYear(), 0, 1, 0, 0, 0, 0), o4 = (r.getTime() - a2) / 86400000 | 0;
      HEAP32[t2 + 28 >> 2] = o4;
    }
    __gmtime_js.sig = "vjp";
    var isLeapYear = (e) => e % 4 === 0 && (e % 100 !== 0 || e % 400 === 0), MONTH_DAYS_LEAP_CUMULATIVE = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335], MONTH_DAYS_REGULAR_CUMULATIVE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], ydayFromDate = (e) => {
      var t2 = isLeapYear(e.getFullYear()), r = t2 ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE, a2 = r[e.getMonth()] + e.getDate() - 1;
      return a2;
    };
    function __localtime_js(e, t2) {
      e = bigintToI53Checked(e);
      var r = new Date(e * 1000);
      HEAP32[t2 >> 2] = r.getSeconds(), HEAP32[t2 + 4 >> 2] = r.getMinutes(), HEAP32[t2 + 8 >> 2] = r.getHours(), HEAP32[t2 + 12 >> 2] = r.getDate(), HEAP32[t2 + 16 >> 2] = r.getMonth(), HEAP32[t2 + 20 >> 2] = r.getFullYear() - 1900, HEAP32[t2 + 24 >> 2] = r.getDay();
      var a2 = ydayFromDate(r) | 0;
      HEAP32[t2 + 28 >> 2] = a2, HEAP32[t2 + 36 >> 2] = -(r.getTimezoneOffset() * 60);
      var o4 = new Date(r.getFullYear(), 0, 1), s4 = new Date(r.getFullYear(), 6, 1).getTimezoneOffset(), l3 = o4.getTimezoneOffset(), _3 = (s4 != l3 && r.getTimezoneOffset() == Math.min(l3, s4)) | 0;
      HEAP32[t2 + 32 >> 2] = _3;
    }
    __localtime_js.sig = "vjp";
    function __mmap_js(e, t2, r, a2, o4, s4, l3) {
      o4 = bigintToI53Checked(o4);
      try {
        if (isNaN(o4))
          return 61;
        var _3 = SYSCALLS.getStreamFromFD(a2), n3 = FS.mmap(_3, e, o4, t2, r), m5 = n3.ptr;
        return HEAP32[s4 >> 2] = n3.allocated, HEAPU32[l3 >> 2] = m5, 0;
      } catch (p4) {
        if (typeof FS > "u" || p4.name !== "ErrnoError")
          throw p4;
        return -p4.errno;
      }
    }
    __mmap_js.sig = "ipiiijpp";
    function __munmap_js(e, t2, r, a2, o4, s4) {
      s4 = bigintToI53Checked(s4);
      try {
        var l3 = SYSCALLS.getStreamFromFD(o4);
        r & 2 && SYSCALLS.doMsync(e, l3, t2, a2, s4);
      } catch (_3) {
        if (typeof FS > "u" || _3.name !== "ErrnoError")
          throw _3;
        return -_3.errno;
      }
    }
    __munmap_js.sig = "ippiiij";
    var timers = {}, handleException = (e) => {
      if (e instanceof ExitStatus || e == "unwind")
        return EXITSTATUS;
      quit_(1, e);
    }, keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0, _proc_exit = (e) => {
      EXITSTATUS = e, keepRuntimeAlive() || (Module.onExit?.(e), ABORT = true), quit_(e, new ExitStatus(e));
    };
    _proc_exit.sig = "vi";
    var exitJS = (e, t2) => {
      EXITSTATUS = e, _proc_exit(e);
    }, _exit = exitJS;
    _exit.sig = "vi";
    var maybeExit = () => {
      if (!keepRuntimeAlive())
        try {
          _exit(EXITSTATUS);
        } catch (e) {
          handleException(e);
        }
    }, callUserCallback = (e) => {
      if (!ABORT)
        try {
          e(), maybeExit();
        } catch (t2) {
          handleException(t2);
        }
    }, _emscripten_get_now = () => performance.now();
    _emscripten_get_now.sig = "d";
    var __setitimer_js = (e, t2) => {
      if (timers[e] && (clearTimeout(timers[e].id), delete timers[e]), !t2)
        return 0;
      var r = setTimeout(() => {
        delete timers[e], callUserCallback(() => __emscripten_timeout(e, _emscripten_get_now()));
      }, t2);
      return timers[e] = { id: r, timeout_ms: t2 }, 0;
    };
    __setitimer_js.sig = "iid";
    var __tzset_js = (e, t2, r, a2) => {
      var o4 = new Date().getFullYear(), s4 = new Date(o4, 0, 1), l3 = new Date(o4, 6, 1), _3 = s4.getTimezoneOffset(), n3 = l3.getTimezoneOffset(), m5 = Math.max(_3, n3);
      HEAPU32[e >> 2] = m5 * 60, HEAP32[t2 >> 2] = +(_3 != n3);
      var p4 = (u2) => {
        var f3 = u2 >= 0 ? "-" : "+", c2 = Math.abs(u2), w4 = String(Math.floor(c2 / 60)).padStart(2, "0"), v3 = String(c2 % 60).padStart(2, "0");
        return `UTC${f3}${w4}${v3}`;
      }, d3 = p4(_3), g5 = p4(n3);
      n3 < _3 ? (stringToUTF8(d3, r, 17), stringToUTF8(g5, a2, 17)) : (stringToUTF8(d3, a2, 17), stringToUTF8(g5, r, 17));
    };
    __tzset_js.sig = "vpppp";
    var _emscripten_date_now = () => Date.now();
    _emscripten_date_now.sig = "d";
    var nowIsMonotonic = 1, checkWasiClock = (e) => e >= 0 && e <= 3;
    function _clock_time_get(e, t2, r) {
      if (t2 = bigintToI53Checked(t2), !checkWasiClock(e))
        return 28;
      var a2;
      if (e === 0)
        a2 = _emscripten_date_now();
      else if (nowIsMonotonic)
        a2 = _emscripten_get_now();
      else
        return 52;
      var o4 = Math.round(a2 * 1000 * 1000);
      return HEAP64[r >> 3] = BigInt(o4), 0;
    }
    _clock_time_get.sig = "iijp";
    var readEmAsmArgsArray = [], readEmAsmArgs = (e, t2) => {
      readEmAsmArgsArray.length = 0;
      for (var r;r = HEAPU8[e++]; ) {
        var a2 = r != 105;
        a2 &= r != 112, t2 += a2 && t2 % 8 ? 4 : 0, readEmAsmArgsArray.push(r == 112 ? HEAPU32[t2 >> 2] : r == 106 ? HEAP64[t2 >> 3] : r == 105 ? HEAP32[t2 >> 2] : HEAPF64[t2 >> 3]), t2 += a2 ? 8 : 4;
      }
      return readEmAsmArgsArray;
    }, runEmAsmFunction = (e, t2, r) => {
      var a2 = readEmAsmArgs(t2, r);
      return ASM_CONSTS[e](...a2);
    }, _emscripten_asm_const_int = (e, t2, r) => runEmAsmFunction(e, t2, r);
    _emscripten_asm_const_int.sig = "ippp";
    var _emscripten_force_exit = (e) => {
      __emscripten_runtime_keepalive_clear(), _exit(e);
    };
    _emscripten_force_exit.sig = "vi";
    var getHeapMax = () => 2147483648, _emscripten_get_heap_max = () => getHeapMax();
    _emscripten_get_heap_max.sig = "p";
    var growMemory = (e) => {
      var t2 = wasmMemory.buffer, r = (e - t2.byteLength + 65535) / 65536 | 0;
      try {
        return wasmMemory.grow(r), updateMemoryViews(), 1;
      } catch {
      }
    }, _emscripten_resize_heap = (e) => {
      var t2 = HEAPU8.length;
      e >>>= 0;
      var r = getHeapMax();
      if (e > r)
        return false;
      for (var a2 = 1;a2 <= 4; a2 *= 2) {
        var o4 = t2 * (1 + 0.2 / a2);
        o4 = Math.min(o4, e + 100663296);
        var s4 = Math.min(r, alignMemory(Math.max(e, o4), 65536)), l3 = growMemory(s4);
        if (l3)
          return true;
      }
      return false;
    };
    _emscripten_resize_heap.sig = "ip";
    var getEnvStrings = () => {
      if (!getEnvStrings.strings) {
        var e = (typeof navigator == "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8", t2 = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: e, _: getExecutableName() };
        for (var r in ENV)
          ENV[r] === undefined ? delete t2[r] : t2[r] = ENV[r];
        var a2 = [];
        for (var r in t2)
          a2.push(`${r}=${t2[r]}`);
        getEnvStrings.strings = a2;
      }
      return getEnvStrings.strings;
    }, stringToAscii = (e, t2) => {
      for (var r = 0;r < e.length; ++r)
        HEAP8[t2++] = e.charCodeAt(r);
      HEAP8[t2] = 0;
    }, _environ_get = (e, t2) => {
      var r = 0;
      return getEnvStrings().forEach((a2, o4) => {
        var s4 = t2 + r;
        HEAPU32[e + o4 * 4 >> 2] = s4, stringToAscii(a2, s4), r += a2.length + 1;
      }), 0;
    };
    _environ_get.sig = "ipp";
    var _environ_sizes_get = (e, t2) => {
      var r = getEnvStrings();
      HEAPU32[e >> 2] = r.length;
      var a2 = 0;
      return r.forEach((o4) => a2 += o4.length + 1), HEAPU32[t2 >> 2] = a2, 0;
    };
    _environ_sizes_get.sig = "ipp";
    function _fd_close(e) {
      try {
        var t2 = SYSCALLS.getStreamFromFD(e);
        return FS.close(t2), 0;
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError")
          throw r;
        return r.errno;
      }
    }
    _fd_close.sig = "ii";
    function _fd_fdstat_get(e, t2) {
      try {
        var r = 0, a2 = 0, o4 = 0, s4 = SYSCALLS.getStreamFromFD(e), l3 = s4.tty ? 2 : FS.isDir(s4.mode) ? 3 : FS.isLink(s4.mode) ? 7 : 4;
        return HEAP8[t2] = l3, HEAP16[t2 + 2 >> 1] = o4, HEAP64[t2 + 8 >> 3] = BigInt(r), HEAP64[t2 + 16 >> 3] = BigInt(a2), 0;
      } catch (_3) {
        if (typeof FS > "u" || _3.name !== "ErrnoError")
          throw _3;
        return _3.errno;
      }
    }
    _fd_fdstat_get.sig = "iip";
    var doReadv = (e, t2, r, a2) => {
      for (var o4 = 0, s4 = 0;s4 < r; s4++) {
        var l3 = HEAPU32[t2 >> 2], _3 = HEAPU32[t2 + 4 >> 2];
        t2 += 8;
        var n3 = FS.read(e, HEAP8, l3, _3, a2);
        if (n3 < 0)
          return -1;
        if (o4 += n3, n3 < _3)
          break;
        typeof a2 < "u" && (a2 += n3);
      }
      return o4;
    };
    function _fd_pread(e, t2, r, a2, o4) {
      a2 = bigintToI53Checked(a2);
      try {
        if (isNaN(a2))
          return 61;
        var s4 = SYSCALLS.getStreamFromFD(e), l3 = doReadv(s4, t2, r, a2);
        return HEAPU32[o4 >> 2] = l3, 0;
      } catch (_3) {
        if (typeof FS > "u" || _3.name !== "ErrnoError")
          throw _3;
        return _3.errno;
      }
    }
    _fd_pread.sig = "iippjp";
    var doWritev = (e, t2, r, a2) => {
      for (var o4 = 0, s4 = 0;s4 < r; s4++) {
        var l3 = HEAPU32[t2 >> 2], _3 = HEAPU32[t2 + 4 >> 2];
        t2 += 8;
        var n3 = FS.write(e, HEAP8, l3, _3, a2);
        if (n3 < 0)
          return -1;
        if (o4 += n3, n3 < _3)
          break;
        typeof a2 < "u" && (a2 += n3);
      }
      return o4;
    };
    function _fd_pwrite(e, t2, r, a2, o4) {
      a2 = bigintToI53Checked(a2);
      try {
        if (isNaN(a2))
          return 61;
        var s4 = SYSCALLS.getStreamFromFD(e), l3 = doWritev(s4, t2, r, a2);
        return HEAPU32[o4 >> 2] = l3, 0;
      } catch (_3) {
        if (typeof FS > "u" || _3.name !== "ErrnoError")
          throw _3;
        return _3.errno;
      }
    }
    _fd_pwrite.sig = "iippjp";
    function _fd_read(e, t2, r, a2) {
      try {
        var o4 = SYSCALLS.getStreamFromFD(e), s4 = doReadv(o4, t2, r);
        return HEAPU32[a2 >> 2] = s4, 0;
      } catch (l3) {
        if (typeof FS > "u" || l3.name !== "ErrnoError")
          throw l3;
        return l3.errno;
      }
    }
    _fd_read.sig = "iippp";
    function _fd_seek(e, t2, r, a2) {
      t2 = bigintToI53Checked(t2);
      try {
        if (isNaN(t2))
          return 61;
        var o4 = SYSCALLS.getStreamFromFD(e);
        return FS.llseek(o4, t2, r), HEAP64[a2 >> 3] = BigInt(o4.position), o4.getdents && t2 === 0 && r === 0 && (o4.getdents = null), 0;
      } catch (s4) {
        if (typeof FS > "u" || s4.name !== "ErrnoError")
          throw s4;
        return s4.errno;
      }
    }
    _fd_seek.sig = "iijip";
    function _fd_sync(e) {
      try {
        var t2 = SYSCALLS.getStreamFromFD(e);
        return t2.stream_ops?.fsync ? t2.stream_ops.fsync(t2) : 0;
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError")
          throw r;
        return r.errno;
      }
    }
    _fd_sync.sig = "ii";
    function _fd_write(e, t2, r, a2) {
      try {
        var o4 = SYSCALLS.getStreamFromFD(e), s4 = doWritev(o4, t2, r);
        return HEAPU32[a2 >> 2] = s4, 0;
      } catch (l3) {
        if (typeof FS > "u" || l3.name !== "ErrnoError")
          throw l3;
        return l3.errno;
      }
    }
    _fd_write.sig = "iippp";
    var _getaddrinfo = (e, t2, r, a2) => {
      var o4 = 0, s4 = 0, l3 = 0, _3 = 0, n3 = 0, m5 = 0, p4;
      function d3(g5, u2, f3, c2, w4, v3) {
        var S3, x6, y4, M3;
        return x6 = g5 === 10 ? 28 : 16, w4 = g5 === 10 ? inetNtop6(w4) : inetNtop4(w4), S3 = _malloc(x6), M3 = writeSockaddr(S3, g5, w4, v3), assert(!M3), y4 = _malloc(32), HEAP32[y4 + 4 >> 2] = g5, HEAP32[y4 + 8 >> 2] = u2, HEAP32[y4 + 12 >> 2] = f3, HEAPU32[y4 + 24 >> 2] = c2, HEAPU32[y4 + 20 >> 2] = S3, g5 === 10 ? HEAP32[y4 + 16 >> 2] = 28 : HEAP32[y4 + 16 >> 2] = 16, HEAP32[y4 + 28 >> 2] = 0, y4;
      }
      if (r && (l3 = HEAP32[r >> 2], _3 = HEAP32[r + 4 >> 2], n3 = HEAP32[r + 8 >> 2], m5 = HEAP32[r + 12 >> 2]), n3 && !m5 && (m5 = n3 === 2 ? 17 : 6), !n3 && m5 && (n3 = m5 === 17 ? 2 : 1), m5 === 0 && (m5 = 6), n3 === 0 && (n3 = 1), !e && !t2)
        return -2;
      if (l3 & -1088 || r !== 0 && HEAP32[r >> 2] & 2 && !e)
        return -1;
      if (l3 & 32)
        return -2;
      if (n3 !== 0 && n3 !== 1 && n3 !== 2)
        return -7;
      if (_3 !== 0 && _3 !== 2 && _3 !== 10)
        return -6;
      if (t2 && (t2 = UTF8ToString(t2), s4 = parseInt(t2, 10), isNaN(s4)))
        return l3 & 1024 ? -2 : -8;
      if (!e)
        return _3 === 0 && (_3 = 2), l3 & 1 || (_3 === 2 ? o4 = _htonl(2130706433) : o4 = [0, 0, 0, _htonl(1)]), p4 = d3(_3, n3, m5, null, o4, s4), HEAPU32[a2 >> 2] = p4, 0;
      if (e = UTF8ToString(e), o4 = inetPton4(e), o4 !== null)
        if (_3 === 0 || _3 === 2)
          _3 = 2;
        else if (_3 === 10 && l3 & 8)
          o4 = [0, 0, _htonl(65535), o4], _3 = 10;
        else
          return -2;
      else if (o4 = inetPton6(e), o4 !== null)
        if (_3 === 0 || _3 === 10)
          _3 = 10;
        else
          return -2;
      return o4 != null ? (p4 = d3(_3, n3, m5, e, o4, s4), HEAPU32[a2 >> 2] = p4, 0) : l3 & 4 ? -2 : (e = DNS.lookup_name(e), o4 = inetPton4(e), _3 === 0 ? _3 = 2 : _3 === 10 && (o4 = [0, 0, _htonl(65535), o4]), p4 = d3(_3, n3, m5, null, o4, s4), HEAPU32[a2 >> 2] = p4, 0);
    };
    _getaddrinfo.sig = "ipppp";
    var _getnameinfo = (e, t2, r, a2, o4, s4, l3) => {
      var _3 = readSockaddr(e, t2);
      if (_3.errno)
        return -6;
      var { port: n3, addr: m5 } = _3, p4 = false;
      if (r && a2) {
        var d3;
        if (l3 & 1 || !(d3 = DNS.lookup_addr(m5))) {
          if (l3 & 8)
            return -2;
        } else
          m5 = d3;
        var g5 = stringToUTF8(m5, r, a2);
        g5 + 1 >= a2 && (p4 = true);
      }
      if (o4 && s4) {
        n3 = "" + n3;
        var g5 = stringToUTF8(n3, o4, s4);
        g5 + 1 >= s4 && (p4 = true);
      }
      return p4 ? -12 : 0;
    };
    _getnameinfo.sig = "ipipipii";
    function _random_get(e, t2) {
      try {
        return randomFill(HEAPU8.subarray(e, e + t2)), 0;
      } catch (r) {
        if (typeof FS > "u" || r.name !== "ErrnoError")
          throw r;
        return r.errno;
      }
    }
    _random_get.sig = "ipp";
    var stringToNewUTF8 = (e) => {
      var t2 = lengthBytesUTF8(e) + 1, r = _malloc(t2);
      return r && stringToUTF8(e, r, t2), r;
    }, getTempRet0 = (e) => __emscripten_tempret_get();
    Module.getTempRet0 = getTempRet0;
    var setTempRet0 = (e) => __emscripten_tempret_set(e), FS_createPath = FS.createPath, FS_unlink = (e) => FS.unlink(e), FS_createLazyFile = FS.createLazyFile, FS_createDevice = FS.createDevice, _setTempRet0 = setTempRet0;
    Module._setTempRet0 = _setTempRet0;
    var _getTempRet0 = getTempRet0;
    Module._getTempRet0 = _getTempRet0;

    class ExceptionInfo {
      constructor(t2) {
        this.excPtr = t2, this.ptr = t2 - 24;
      }
      set_type(t2) {
        HEAPU32[this.ptr + 4 >> 2] = t2;
      }
      get_type() {
        return HEAPU32[this.ptr + 4 >> 2];
      }
      set_destructor(t2) {
        HEAPU32[this.ptr + 8 >> 2] = t2;
      }
      get_destructor() {
        return HEAPU32[this.ptr + 8 >> 2];
      }
      set_caught(t2) {
        t2 = t2 ? 1 : 0, HEAP8[this.ptr + 12] = t2;
      }
      get_caught() {
        return HEAP8[this.ptr + 12] != 0;
      }
      set_rethrown(t2) {
        t2 = t2 ? 1 : 0, HEAP8[this.ptr + 13] = t2;
      }
      get_rethrown() {
        return HEAP8[this.ptr + 13] != 0;
      }
      init(t2, r) {
        this.set_adjusted_ptr(0), this.set_type(t2), this.set_destructor(r);
      }
      set_adjusted_ptr(t2) {
        HEAPU32[this.ptr + 16 >> 2] = t2;
      }
      get_adjusted_ptr() {
        return HEAPU32[this.ptr + 16 >> 2];
      }
    }
    var exceptionLast = 0, uncaughtExceptionCount = 0, ___cxa_throw = (e, t2, r) => {
      var a2 = new ExceptionInfo(e);
      throw a2.init(t2, r), exceptionLast = e, uncaughtExceptionCount++, exceptionLast;
    };
    Module.___cxa_throw = ___cxa_throw, ___cxa_throw.sig = "vppp", registerWasmPlugin(), FS.createPreloadedFile = FS_createPreloadedFile, FS.staticInit(), Module.FS_createPath = FS.createPath, Module.FS_createDataFile = FS.createDataFile, Module.FS_createPreloadedFile = FS.createPreloadedFile, Module.FS_unlink = FS.unlink, Module.FS_createLazyFile = FS.createLazyFile, Module.FS_createDevice = FS.createDevice, MEMFS.doesNotExistError = new FS.ErrnoError(44), MEMFS.doesNotExistError.stack = "<generic error, no stack>", ENVIRONMENT_IS_NODE && NODEFS.staticInit();
    var wasmImports = { __assert_fail: ___assert_fail, __call_sighandler: ___call_sighandler, __cxa_throw: ___cxa_throw, __heap_base: ___heap_base, __indirect_function_table: wasmTable, __memory_base: ___memory_base, __stack_high: ___stack_high, __stack_low: ___stack_low, __stack_pointer: ___stack_pointer, __syscall__newselect: ___syscall__newselect, __syscall_accept4: ___syscall_accept4, __syscall_bind: ___syscall_bind, __syscall_chdir: ___syscall_chdir, __syscall_chmod: ___syscall_chmod, __syscall_connect: ___syscall_connect, __syscall_dup: ___syscall_dup, __syscall_dup3: ___syscall_dup3, __syscall_faccessat: ___syscall_faccessat, __syscall_fadvise64: ___syscall_fadvise64, __syscall_fallocate: ___syscall_fallocate, __syscall_fcntl64: ___syscall_fcntl64, __syscall_fdatasync: ___syscall_fdatasync, __syscall_fstat64: ___syscall_fstat64, __syscall_ftruncate64: ___syscall_ftruncate64, __syscall_getcwd: ___syscall_getcwd, __syscall_getdents64: ___syscall_getdents64, __syscall_getsockname: ___syscall_getsockname, __syscall_getsockopt: ___syscall_getsockopt, __syscall_ioctl: ___syscall_ioctl, __syscall_listen: ___syscall_listen, __syscall_lstat64: ___syscall_lstat64, __syscall_mkdirat: ___syscall_mkdirat, __syscall_newfstatat: ___syscall_newfstatat, __syscall_openat: ___syscall_openat, __syscall_pipe: ___syscall_pipe, __syscall_poll: ___syscall_poll, __syscall_readlinkat: ___syscall_readlinkat, __syscall_recvfrom: ___syscall_recvfrom, __syscall_renameat: ___syscall_renameat, __syscall_rmdir: ___syscall_rmdir, __syscall_sendto: ___syscall_sendto, __syscall_socket: ___syscall_socket, __syscall_stat64: ___syscall_stat64, __syscall_symlinkat: ___syscall_symlinkat, __syscall_truncate64: ___syscall_truncate64, __syscall_unlinkat: ___syscall_unlinkat, __table_base: ___table_base, _abort_js: __abort_js, _dlopen_js: __dlopen_js, _dlsym_js: __dlsym_js, _emscripten_get_progname: __emscripten_get_progname, _emscripten_lookup_name: __emscripten_lookup_name, _emscripten_memcpy_js: __emscripten_memcpy_js, _emscripten_runtime_keepalive_clear: __emscripten_runtime_keepalive_clear, _emscripten_system: __emscripten_system, _emscripten_throw_longjmp: __emscripten_throw_longjmp, _gmtime_js: __gmtime_js, _localtime_js: __localtime_js, _mmap_js: __mmap_js, _munmap_js: __munmap_js, _setitimer_js: __setitimer_js, _tzset_js: __tzset_js, clock_time_get: _clock_time_get, emscripten_asm_const_int: _emscripten_asm_const_int, emscripten_date_now: _emscripten_date_now, emscripten_force_exit: _emscripten_force_exit, emscripten_get_heap_max: _emscripten_get_heap_max, emscripten_get_now: _emscripten_get_now, emscripten_resize_heap: _emscripten_resize_heap, environ_get: _environ_get, environ_sizes_get: _environ_sizes_get, exit: _exit, fd_close: _fd_close, fd_fdstat_get: _fd_fdstat_get, fd_pread: _fd_pread, fd_pwrite: _fd_pwrite, fd_read: _fd_read, fd_seek: _fd_seek, fd_sync: _fd_sync, fd_write: _fd_write, getTempRet0: _getTempRet0, getaddrinfo: _getaddrinfo, getnameinfo: _getnameinfo, invoke_di, invoke_i, invoke_id, invoke_ii, invoke_iii, invoke_iiii, invoke_iiiii, invoke_iiiiii, invoke_iiiiiii, invoke_iiiiiiii, invoke_iiiiiiiii, invoke_iiiiiiiiii, invoke_iiiiiiiiiii, invoke_iiiiiiiiiiiiii, invoke_iiiiiiiiiiiiiiiiii, invoke_iiiiiji, invoke_iiiij, invoke_iiiijii, invoke_iiij, invoke_iiji, invoke_ij, invoke_ijiiiii, invoke_ijiiiiii, invoke_j, invoke_ji, invoke_jii, invoke_jiiii, invoke_jiiiiii, invoke_jiiiiiiiii, invoke_v, invoke_vi, invoke_vid, invoke_vii, invoke_viii, invoke_viiii, invoke_viiiii, invoke_viiiiii, invoke_viiiiiii, invoke_viiiiiiii, invoke_viiiiiiiii, invoke_viiiiiiiiiiii, invoke_viiiji, invoke_viij, invoke_viiji, invoke_viijii, invoke_viijiiii, invoke_vij, invoke_viji, invoke_vijiji, invoke_vj, invoke_vji, memory: wasmMemory, proc_exit: _proc_exit, random_get: _random_get, setTempRet0: _setTempRet0 }, wasmExports;
    createWasm();
    var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports.__wasm_call_ctors)(), _fiprintf = Module._fiprintf = (e, t2, r) => (_fiprintf = Module._fiprintf = wasmExports.fiprintf)(e, t2, r), _fopen = Module._fopen = (e, t2) => (_fopen = Module._fopen = wasmExports.fopen)(e, t2), _fflush = Module._fflush = (e) => (_fflush = Module._fflush = wasmExports.fflush)(e), _fclose = Module._fclose = (e) => (_fclose = Module._fclose = wasmExports.fclose)(e), _free = Module._free = (e) => (_free = Module._free = wasmExports.free)(e), ___errno_location = Module.___errno_location = () => (___errno_location = Module.___errno_location = wasmExports.__errno_location)(), _ProcessInterrupts = Module._ProcessInterrupts = () => (_ProcessInterrupts = Module._ProcessInterrupts = wasmExports.ProcessInterrupts)(), _errstart_cold = Module._errstart_cold = (e, t2) => (_errstart_cold = Module._errstart_cold = wasmExports.errstart_cold)(e, t2), _errcode = Module._errcode = (e) => (_errcode = Module._errcode = wasmExports.errcode)(e), _errmsg = Module._errmsg = (e, t2) => (_errmsg = Module._errmsg = wasmExports.errmsg)(e, t2), _errfinish = Module._errfinish = (e, t2, r) => (_errfinish = Module._errfinish = wasmExports.errfinish)(e, t2, r), _puts = Module._puts = (e) => (_puts = Module._puts = wasmExports.puts)(e), _errstart = Module._errstart = (e, t2) => (_errstart = Module._errstart = wasmExports.errstart)(e, t2), _errmsg_internal = Module._errmsg_internal = (e, t2) => (_errmsg_internal = Module._errmsg_internal = wasmExports.errmsg_internal)(e, t2), _errdetail = Module._errdetail = (e, t2) => (_errdetail = Module._errdetail = wasmExports.errdetail)(e, t2), _errhint = Module._errhint = (e, t2) => (_errhint = Module._errhint = wasmExports.errhint)(e, t2), _pg_parse_query = Module._pg_parse_query = (e) => (_pg_parse_query = Module._pg_parse_query = wasmExports.pg_parse_query)(e), _gettimeofday = Module._gettimeofday = (e, t2) => (_gettimeofday = Module._gettimeofday = wasmExports.gettimeofday)(e, t2), _raw_parser = Module._raw_parser = (e, t2) => (_raw_parser = Module._raw_parser = wasmExports.raw_parser)(e, t2), _initStringInfo = Module._initStringInfo = (e) => (_initStringInfo = Module._initStringInfo = wasmExports.initStringInfo)(e), _appendStringInfoString = Module._appendStringInfoString = (e, t2) => (_appendStringInfoString = Module._appendStringInfoString = wasmExports.appendStringInfoString)(e, t2), _appendStringInfo = Module._appendStringInfo = (e, t2, r) => (_appendStringInfo = Module._appendStringInfo = wasmExports.appendStringInfo)(e, t2, r), _errdetail_internal = Module._errdetail_internal = (e, t2) => (_errdetail_internal = Module._errdetail_internal = wasmExports.errdetail_internal)(e, t2), _pfree = Module._pfree = (e) => (_pfree = Module._pfree = wasmExports.pfree)(e), _list_make1_impl = Module._list_make1_impl = (e, t2) => (_list_make1_impl = Module._list_make1_impl = wasmExports.list_make1_impl)(e, t2), _QueryRewrite = Module._QueryRewrite = (e) => (_QueryRewrite = Module._QueryRewrite = wasmExports.QueryRewrite)(e), _pg_plan_query = Module._pg_plan_query = (e, t2, r, a2) => (_pg_plan_query = Module._pg_plan_query = wasmExports.pg_plan_query)(e, t2, r, a2), _palloc0 = Module._palloc0 = (e) => (_palloc0 = Module._palloc0 = wasmExports.palloc0)(e), _lappend = Module._lappend = (e, t2) => (_lappend = Module._lappend = wasmExports.lappend)(e, t2), _GetCurrentTimestamp = Module._GetCurrentTimestamp = () => (_GetCurrentTimestamp = Module._GetCurrentTimestamp = wasmExports.GetCurrentTimestamp)(), _pg_prng_double = Module._pg_prng_double = (e) => (_pg_prng_double = Module._pg_prng_double = wasmExports.pg_prng_double)(e), _pg_snprintf = Module._pg_snprintf = (e, t2, r, a2) => (_pg_snprintf = Module._pg_snprintf = wasmExports.pg_snprintf)(e, t2, r, a2), _sigaddset = Module._sigaddset = (e, t2) => (_sigaddset = Module._sigaddset = wasmExports.sigaddset)(e, t2), _die = Module._die = (e) => (_die = Module._die = wasmExports.die)(e), _check_stack_depth = Module._check_stack_depth = () => (_check_stack_depth = Module._check_stack_depth = wasmExports.check_stack_depth)(), _pre_format_elog_string = Module._pre_format_elog_string = (e, t2) => (_pre_format_elog_string = Module._pre_format_elog_string = wasmExports.pre_format_elog_string)(e, t2), _format_elog_string = Module._format_elog_string = (e, t2) => (_format_elog_string = Module._format_elog_string = wasmExports.format_elog_string)(e, t2), _pstrdup = Module._pstrdup = (e) => (_pstrdup = Module._pstrdup = wasmExports.pstrdup)(e), _SplitIdentifierString = Module._SplitIdentifierString = (e, t2, r) => (_SplitIdentifierString = Module._SplitIdentifierString = wasmExports.SplitIdentifierString)(e, t2, r), _list_free = Module._list_free = (e) => (_list_free = Module._list_free = wasmExports.list_free)(e), _pg_strcasecmp = Module._pg_strcasecmp = (e, t2) => (_pg_strcasecmp = Module._pg_strcasecmp = wasmExports.pg_strcasecmp)(e, t2), _guc_malloc = Module._guc_malloc = (e, t2) => (_guc_malloc = Module._guc_malloc = wasmExports.guc_malloc)(e, t2), _SetConfigOption = Module._SetConfigOption = (e, t2, r, a2) => (_SetConfigOption = Module._SetConfigOption = wasmExports.SetConfigOption)(e, t2, r, a2), _pg_sprintf = Module._pg_sprintf = (e, t2, r) => (_pg_sprintf = Module._pg_sprintf = wasmExports.pg_sprintf)(e, t2, r), _strcmp = Module._strcmp = (e, t2) => (_strcmp = Module._strcmp = wasmExports.strcmp)(e, t2), _strdup = Module._strdup = (e) => (_strdup = Module._strdup = wasmExports.strdup)(e), _atoi = Module._atoi = (e) => (_atoi = Module._atoi = wasmExports.atoi)(e), _strlcpy = Module._strlcpy = (e, t2, r) => (_strlcpy = Module._strlcpy = wasmExports.strlcpy)(e, t2, r), _pgl_shutdown = Module._pgl_shutdown = () => (_pgl_shutdown = Module._pgl_shutdown = wasmExports.pgl_shutdown)(), _pgl_closed = Module._pgl_closed = () => (_pgl_closed = Module._pgl_closed = wasmExports.pgl_closed)(), _resetStringInfo = Module._resetStringInfo = (e) => (_resetStringInfo = Module._resetStringInfo = wasmExports.resetStringInfo)(e), _getc = Module._getc = (e) => (_getc = Module._getc = wasmExports.getc)(e), _appendStringInfoChar = Module._appendStringInfoChar = (e, t2) => (_appendStringInfoChar = Module._appendStringInfoChar = wasmExports.appendStringInfoChar)(e, t2), _strlen = Module._strlen = (e) => (_strlen = Module._strlen = wasmExports.strlen)(e), _strncmp = Module._strncmp = (e, t2, r) => (_strncmp = Module._strncmp = wasmExports.strncmp)(e, t2, r), _pg_fprintf = Module._pg_fprintf = (e, t2, r) => (_pg_fprintf = Module._pg_fprintf = wasmExports.pg_fprintf)(e, t2, r), _pgstat_report_activity = Module._pgstat_report_activity = (e, t2) => (_pgstat_report_activity = Module._pgstat_report_activity = wasmExports.pgstat_report_activity)(e, t2), _errhidestmt = Module._errhidestmt = (e) => (_errhidestmt = Module._errhidestmt = wasmExports.errhidestmt)(e), _GetTransactionSnapshot = Module._GetTransactionSnapshot = () => (_GetTransactionSnapshot = Module._GetTransactionSnapshot = wasmExports.GetTransactionSnapshot)(), _PushActiveSnapshot = Module._PushActiveSnapshot = (e) => (_PushActiveSnapshot = Module._PushActiveSnapshot = wasmExports.PushActiveSnapshot)(e), _AllocSetContextCreateInternal = Module._AllocSetContextCreateInternal = (e, t2, r, a2, o4) => (_AllocSetContextCreateInternal = Module._AllocSetContextCreateInternal = wasmExports.AllocSetContextCreateInternal)(e, t2, r, a2, o4), _PopActiveSnapshot = Module._PopActiveSnapshot = () => (_PopActiveSnapshot = Module._PopActiveSnapshot = wasmExports.PopActiveSnapshot)(), _CreateDestReceiver = Module._CreateDestReceiver = (e) => (_CreateDestReceiver = Module._CreateDestReceiver = wasmExports.CreateDestReceiver)(e), _CommitTransactionCommand = Module._CommitTransactionCommand = () => (_CommitTransactionCommand = Module._CommitTransactionCommand = wasmExports.CommitTransactionCommand)(), _CommandCounterIncrement = Module._CommandCounterIncrement = () => (_CommandCounterIncrement = Module._CommandCounterIncrement = wasmExports.CommandCounterIncrement)(), _MemoryContextDelete = Module._MemoryContextDelete = (e) => (_MemoryContextDelete = Module._MemoryContextDelete = wasmExports.MemoryContextDelete)(e), _StartTransactionCommand = Module._StartTransactionCommand = () => (_StartTransactionCommand = Module._StartTransactionCommand = wasmExports.StartTransactionCommand)(), _enlargeStringInfo = Module._enlargeStringInfo = (e, t2) => (_enlargeStringInfo = Module._enlargeStringInfo = wasmExports.enlargeStringInfo)(e, t2), ___wasm_setjmp_test = Module.___wasm_setjmp_test = (e, t2) => (___wasm_setjmp_test = Module.___wasm_setjmp_test = wasmExports.__wasm_setjmp_test)(e, t2), _pg_printf = Module._pg_printf = (e, t2) => (_pg_printf = Module._pg_printf = wasmExports.pg_printf)(e, t2), ___wasm_setjmp = Module.___wasm_setjmp = (e, t2, r) => (___wasm_setjmp = Module.___wasm_setjmp = wasmExports.__wasm_setjmp)(e, t2, r), _FlushErrorState = Module._FlushErrorState = () => (_FlushErrorState = Module._FlushErrorState = wasmExports.FlushErrorState)(), _emscripten_longjmp = Module._emscripten_longjmp = (e, t2) => (_emscripten_longjmp = Module._emscripten_longjmp = wasmExports.emscripten_longjmp)(e, t2), _malloc = Module._malloc = (e) => (_malloc = Module._malloc = wasmExports.malloc)(e), _realloc = Module._realloc = (e, t2) => (_realloc = Module._realloc = wasmExports.realloc)(e, t2), _getenv = Module._getenv = (e) => (_getenv = Module._getenv = wasmExports.getenv)(e), _strspn = Module._strspn = (e, t2) => (_strspn = Module._strspn = wasmExports.strspn)(e, t2), _strnlen = Module._strnlen = (e, t2) => (_strnlen = Module._strnlen = wasmExports.strnlen)(e, t2), _setenv = Module._setenv = (e, t2, r) => (_setenv = Module._setenv = wasmExports.setenv)(e, t2, r), _mkdir = Module._mkdir = (e, t2) => (_mkdir = Module._mkdir = wasmExports.mkdir)(e, t2), _fileno = Module._fileno = (e) => (_fileno = Module._fileno = wasmExports.fileno)(e), _isatty = Module._isatty = (e) => (_isatty = Module._isatty = wasmExports.isatty)(e), _strchr = Module._strchr = (e, t2) => (_strchr = Module._strchr = wasmExports.strchr)(e, t2), _pg_vsnprintf = Module._pg_vsnprintf = (e, t2, r, a2) => (_pg_vsnprintf = Module._pg_vsnprintf = wasmExports.pg_vsnprintf)(e, t2, r, a2), _strcpy = Module._strcpy = (e, t2) => (_strcpy = Module._strcpy = wasmExports.strcpy)(e, t2), _pg_get_encoding_from_locale = Module._pg_get_encoding_from_locale = (e, t2) => (_pg_get_encoding_from_locale = Module._pg_get_encoding_from_locale = wasmExports.pg_get_encoding_from_locale)(e, t2), _pg_encoding_to_char_private = Module._pg_encoding_to_char_private = (e) => (_pg_encoding_to_char_private = Module._pg_encoding_to_char_private = wasmExports.pg_encoding_to_char_private)(e), _psprintf = Module._psprintf = (e, t2) => (_psprintf = Module._psprintf = wasmExports.psprintf)(e, t2), _stat = Module._stat = (e, t2) => (_stat = Module._stat = wasmExports.stat)(e, t2), _pqsignal = Module._pqsignal = (e, t2) => (_pqsignal = Module._pqsignal = wasmExports.pqsignal)(e, t2), _chmod = Module._chmod = (e, t2) => (_chmod = Module._chmod = wasmExports.chmod)(e, t2), _fwrite = Module._fwrite = (e, t2, r, a2) => (_fwrite = Module._fwrite = wasmExports.fwrite)(e, t2, r, a2), _strftime = Module._strftime = (e, t2, r, a2) => (_strftime = Module._strftime = wasmExports.strftime)(e, t2, r, a2), _strstr = Module._strstr = (e, t2) => (_strstr = Module._strstr = wasmExports.strstr)(e, t2), _fputs = Module._fputs = (e, t2) => (_fputs = Module._fputs = wasmExports.fputs)(e, t2), _atexit = Module._atexit = (e) => (_atexit = Module._atexit = wasmExports.atexit)(e), _strtol = Module._strtol = (e, t2, r) => (_strtol = Module._strtol = wasmExports.strtol)(e, t2, r), _ferror = Module._ferror = (e) => (_ferror = Module._ferror = wasmExports.ferror)(e), _pg_strip_crlf = Module._pg_strip_crlf = (e) => (_pg_strip_crlf = Module._pg_strip_crlf = wasmExports.pg_strip_crlf)(e), _get_buffer_size = Module._get_buffer_size = (e) => (_get_buffer_size = Module._get_buffer_size = wasmExports.get_buffer_size)(e), _get_buffer_addr = Module._get_buffer_addr = (e) => (_get_buffer_addr = Module._get_buffer_addr = wasmExports.get_buffer_addr)(e), _get_channel = Module._get_channel = () => (_get_channel = Module._get_channel = wasmExports.get_channel)(), _interactive_read = Module._interactive_read = () => (_interactive_read = Module._interactive_read = wasmExports.interactive_read)(), _interactive_write = Module._interactive_write = (e) => (_interactive_write = Module._interactive_write = wasmExports.interactive_write)(e), _use_wire = Module._use_wire = (e) => (_use_wire = Module._use_wire = wasmExports.use_wire)(e), _clear_error = Module._clear_error = () => (_clear_error = Module._clear_error = wasmExports.clear_error)(), _interactive_one = Module._interactive_one = () => (_interactive_one = Module._interactive_one = wasmExports.interactive_one)(), _abort = Module._abort = () => (_abort = Module._abort = wasmExports.abort)(), _fseek = Module._fseek = (e, t2, r) => (_fseek = Module._fseek = wasmExports.fseek)(e, t2, r), _ftell = Module._ftell = (e) => (_ftell = Module._ftell = wasmExports.ftell)(e), _pq_recvbuf_fill = Module._pq_recvbuf_fill = (e, t2) => (_pq_recvbuf_fill = Module._pq_recvbuf_fill = wasmExports.pq_recvbuf_fill)(e, t2), _pq_getmsgint = Module._pq_getmsgint = (e, t2) => (_pq_getmsgint = Module._pq_getmsgint = wasmExports.pq_getmsgint)(e, t2), _palloc = Module._palloc = (e) => (_palloc = Module._palloc = wasmExports.palloc)(e), _makeParamList = Module._makeParamList = (e) => (_makeParamList = Module._makeParamList = wasmExports.makeParamList)(e), _getTypeInputInfo = Module._getTypeInputInfo = (e, t2, r) => (_getTypeInputInfo = Module._getTypeInputInfo = wasmExports.getTypeInputInfo)(e, t2, r), _pnstrdup = Module._pnstrdup = (e, t2) => (_pnstrdup = Module._pnstrdup = wasmExports.pnstrdup)(e, t2), _MemoryContextSetParent = Module._MemoryContextSetParent = (e, t2) => (_MemoryContextSetParent = Module._MemoryContextSetParent = wasmExports.MemoryContextSetParent)(e, t2), _unlink = Module._unlink = (e) => (_unlink = Module._unlink = wasmExports.unlink)(e), _pgl_backend = Module._pgl_backend = () => (_pgl_backend = Module._pgl_backend = wasmExports.pgl_backend)(), _pgl_initdb = Module._pgl_initdb = () => (_pgl_initdb = Module._pgl_initdb = wasmExports.pgl_initdb)(), _dup = Module._dup = (e) => (_dup = Module._dup = wasmExports.dup)(e), _fdopen = Module._fdopen = (e, t2) => (_fdopen = Module._fdopen = wasmExports.fdopen)(e, t2), _main = Module._main = (e, t2) => (_main = Module._main = wasmExports.__main_argc_argv)(e, t2), _appendStringInfoStringQuoted = Module._appendStringInfoStringQuoted = (e, t2, r) => (_appendStringInfoStringQuoted = Module._appendStringInfoStringQuoted = wasmExports.appendStringInfoStringQuoted)(e, t2, r), _set_errcontext_domain = Module._set_errcontext_domain = (e) => (_set_errcontext_domain = Module._set_errcontext_domain = wasmExports.set_errcontext_domain)(e), _errcontext_msg = Module._errcontext_msg = (e, t2) => (_errcontext_msg = Module._errcontext_msg = wasmExports.errcontext_msg)(e, t2), _pg_is_ascii = Module._pg_is_ascii = (e) => (_pg_is_ascii = Module._pg_is_ascii = wasmExports.pg_is_ascii)(e), _memchr = Module._memchr = (e, t2, r) => (_memchr = Module._memchr = wasmExports.memchr)(e, t2, r), _strrchr = Module._strrchr = (e, t2) => (_strrchr = Module._strrchr = wasmExports.strrchr)(e, t2), _replace_percent_placeholders = Module._replace_percent_placeholders = (e, t2, r, a2) => (_replace_percent_placeholders = Module._replace_percent_placeholders = wasmExports.replace_percent_placeholders)(e, t2, r, a2), _pg_b64_encode = Module._pg_b64_encode = (e, t2, r, a2) => (_pg_b64_encode = Module._pg_b64_encode = wasmExports.pg_b64_encode)(e, t2, r, a2), _pg_b64_decode = Module._pg_b64_decode = (e, t2, r, a2) => (_pg_b64_decode = Module._pg_b64_decode = wasmExports.pg_b64_decode)(e, t2, r, a2), _pg_b64_enc_len = Module._pg_b64_enc_len = (e) => (_pg_b64_enc_len = Module._pg_b64_enc_len = wasmExports.pg_b64_enc_len)(e), _pg_b64_dec_len = Module._pg_b64_dec_len = (e) => (_pg_b64_dec_len = Module._pg_b64_dec_len = wasmExports.pg_b64_dec_len)(e), _MemoryContextAllocZero = Module._MemoryContextAllocZero = (e, t2) => (_MemoryContextAllocZero = Module._MemoryContextAllocZero = wasmExports.MemoryContextAllocZero)(e, t2), _MemoryContextAllocExtended = Module._MemoryContextAllocExtended = (e, t2, r) => (_MemoryContextAllocExtended = Module._MemoryContextAllocExtended = wasmExports.MemoryContextAllocExtended)(e, t2, r), _hash_bytes = Module._hash_bytes = (e, t2) => (_hash_bytes = Module._hash_bytes = wasmExports.hash_bytes)(e, t2), _memcmp = Module._memcmp = (e, t2, r) => (_memcmp = Module._memcmp = wasmExports.memcmp)(e, t2, r), _repalloc = Module._repalloc = (e, t2) => (_repalloc = Module._repalloc = wasmExports.repalloc)(e, t2), _pg_qsort = Module._pg_qsort = (e, t2, r, a2) => (_pg_qsort = Module._pg_qsort = wasmExports.pg_qsort)(e, t2, r, a2), _strlcat = Module._strlcat = (e, t2, r) => (_strlcat = Module._strlcat = wasmExports.strlcat)(e, t2, r), _OpenTransientFile = Module._OpenTransientFile = (e, t2) => (_OpenTransientFile = Module._OpenTransientFile = wasmExports.OpenTransientFile)(e, t2), _errcode_for_file_access = Module._errcode_for_file_access = () => (_errcode_for_file_access = Module._errcode_for_file_access = wasmExports.errcode_for_file_access)(), _read = Module._read = (e, t2, r) => (_read = Module._read = wasmExports.read)(e, t2, r), _CloseTransientFile = Module._CloseTransientFile = (e) => (_CloseTransientFile = Module._CloseTransientFile = wasmExports.CloseTransientFile)(e), _time = Module._time = (e) => (_time = Module._time = wasmExports.time)(e), _write = Module._write = (e, t2, r) => (_write = Module._write = wasmExports.write)(e, t2, r), _close = Module._close = (e) => (_close = Module._close = wasmExports.close)(e), ___multi3 = Module.___multi3 = (e, t2, r, a2, o4) => (___multi3 = Module.___multi3 = wasmExports.__multi3)(e, t2, r, a2, o4), _pg_char_to_encoding_private = Module._pg_char_to_encoding_private = (e) => (_pg_char_to_encoding_private = Module._pg_char_to_encoding_private = wasmExports.pg_char_to_encoding_private)(e), _isalnum = Module._isalnum = (e) => (_isalnum = Module._isalnum = wasmExports.isalnum)(e), _popen = Module._popen = (e, t2) => (_popen = Module._popen = wasmExports.popen)(e, t2), _pclose = Module._pclose = (e) => (_pclose = Module._pclose = wasmExports.pclose)(e), _wait_result_to_str = Module._wait_result_to_str = (e) => (_wait_result_to_str = Module._wait_result_to_str = wasmExports.wait_result_to_str)(e), _float_to_shortest_decimal_bufn = Module._float_to_shortest_decimal_bufn = (e, t2) => (_float_to_shortest_decimal_bufn = Module._float_to_shortest_decimal_bufn = wasmExports.float_to_shortest_decimal_bufn)(e, t2), _float_to_shortest_decimal_buf = Module._float_to_shortest_decimal_buf = (e, t2) => (_float_to_shortest_decimal_buf = Module._float_to_shortest_decimal_buf = wasmExports.float_to_shortest_decimal_buf)(e, t2), _pwrite = Module._pwrite = (e, t2, r, a2) => (_pwrite = Module._pwrite = wasmExports.pwrite)(e, t2, r, a2), _hash_bytes_extended = Module._hash_bytes_extended = (e, t2, r) => (_hash_bytes_extended = Module._hash_bytes_extended = wasmExports.hash_bytes_extended)(e, t2, r), _pg_getaddrinfo_all = Module._pg_getaddrinfo_all = (e, t2, r, a2) => (_pg_getaddrinfo_all = Module._pg_getaddrinfo_all = wasmExports.pg_getaddrinfo_all)(e, t2, r, a2), _calloc = Module._calloc = (e, t2) => (_calloc = Module._calloc = wasmExports.calloc)(e, t2), _pg_freeaddrinfo_all = Module._pg_freeaddrinfo_all = (e, t2) => (_pg_freeaddrinfo_all = Module._pg_freeaddrinfo_all = wasmExports.pg_freeaddrinfo_all)(e, t2), _freeaddrinfo = Module._freeaddrinfo = (e) => (_freeaddrinfo = Module._freeaddrinfo = wasmExports.freeaddrinfo)(e), _pg_getnameinfo_all = Module._pg_getnameinfo_all = (e, t2, r, a2, o4, s4, l3) => (_pg_getnameinfo_all = Module._pg_getnameinfo_all = wasmExports.pg_getnameinfo_all)(e, t2, r, a2, o4, s4, l3), _IsValidJsonNumber = Module._IsValidJsonNumber = (e, t2) => (_IsValidJsonNumber = Module._IsValidJsonNumber = wasmExports.IsValidJsonNumber)(e, t2), _appendBinaryStringInfo = Module._appendBinaryStringInfo = (e, t2, r) => (_appendBinaryStringInfo = Module._appendBinaryStringInfo = wasmExports.appendBinaryStringInfo)(e, t2, r), _makeStringInfo = Module._makeStringInfo = () => (_makeStringInfo = Module._makeStringInfo = wasmExports.makeStringInfo)(), _pg_encoding_mblen_or_incomplete = Module._pg_encoding_mblen_or_incomplete = (e, t2, r) => (_pg_encoding_mblen_or_incomplete = Module._pg_encoding_mblen_or_incomplete = wasmExports.pg_encoding_mblen_or_incomplete)(e, t2, r), _GetDatabaseEncodingName = Module._GetDatabaseEncodingName = () => (_GetDatabaseEncodingName = Module._GetDatabaseEncodingName = wasmExports.GetDatabaseEncodingName)(), _ScanKeywordLookup = Module._ScanKeywordLookup = (e, t2) => (_ScanKeywordLookup = Module._ScanKeywordLookup = wasmExports.ScanKeywordLookup)(e, t2), _pg_md5_encrypt = Module._pg_md5_encrypt = (e, t2, r, a2, o4) => (_pg_md5_encrypt = Module._pg_md5_encrypt = wasmExports.pg_md5_encrypt)(e, t2, r, a2, o4), _strtoul = Module._strtoul = (e, t2, r) => (_strtoul = Module._strtoul = wasmExports.strtoul)(e, t2, r), _sscanf = Module._sscanf = (e, t2, r) => (_sscanf = Module._sscanf = wasmExports.sscanf)(e, t2, r), _fgets = Module._fgets = (e, t2, r) => (_fgets = Module._fgets = wasmExports.fgets)(e, t2, r), _pg_prng_seed = Module._pg_prng_seed = (e, t2) => (_pg_prng_seed = Module._pg_prng_seed = wasmExports.pg_prng_seed)(e, t2), _pg_prng_seed_check = Module._pg_prng_seed_check = (e) => (_pg_prng_seed_check = Module._pg_prng_seed_check = wasmExports.pg_prng_seed_check)(e), _pg_prng_uint64 = Module._pg_prng_uint64 = (e) => (_pg_prng_uint64 = Module._pg_prng_uint64 = wasmExports.pg_prng_uint64)(e), _pg_prng_uint64_range = Module._pg_prng_uint64_range = (e, t2, r) => (_pg_prng_uint64_range = Module._pg_prng_uint64_range = wasmExports.pg_prng_uint64_range)(e, t2, r), _pg_prng_uint32 = Module._pg_prng_uint32 = (e) => (_pg_prng_uint32 = Module._pg_prng_uint32 = wasmExports.pg_prng_uint32)(e), _log = Module._log = (e) => (_log = Module._log = wasmExports.log)(e), _sin = Module._sin = (e) => (_sin = Module._sin = wasmExports.sin)(e), _opendir = Module._opendir = (e) => (_opendir = Module._opendir = wasmExports.opendir)(e), _readdir = Module._readdir = (e) => (_readdir = Module._readdir = wasmExports.readdir)(e), _closedir = Module._closedir = (e) => (_closedir = Module._closedir = wasmExports.closedir)(e), _forkname_to_number = Module._forkname_to_number = (e) => (_forkname_to_number = Module._forkname_to_number = wasmExports.forkname_to_number)(e), _pg_saslprep = Module._pg_saslprep = (e, t2) => (_pg_saslprep = Module._pg_saslprep = wasmExports.pg_saslprep)(e, t2), _pg_utf_mblen_private = Module._pg_utf_mblen_private = (e) => (_pg_utf_mblen_private = Module._pg_utf_mblen_private = wasmExports.pg_utf_mblen_private)(e), _pg_utf8_islegal = Module._pg_utf8_islegal = (e, t2) => (_pg_utf8_islegal = Module._pg_utf8_islegal = wasmExports.pg_utf8_islegal)(e, t2), _bsearch = Module._bsearch = (e, t2, r, a2, o4) => (_bsearch = Module._bsearch = wasmExports.bsearch)(e, t2, r, a2, o4), _scram_SaltedPassword = Module._scram_SaltedPassword = (e, t2, r, a2, o4, s4, l3, _3) => (_scram_SaltedPassword = Module._scram_SaltedPassword = wasmExports.scram_SaltedPassword)(e, t2, r, a2, o4, s4, l3, _3), _pg_hmac_create = Module._pg_hmac_create = (e) => (_pg_hmac_create = Module._pg_hmac_create = wasmExports.pg_hmac_create)(e), _pg_hmac_error = Module._pg_hmac_error = (e) => (_pg_hmac_error = Module._pg_hmac_error = wasmExports.pg_hmac_error)(e), _pg_hmac_init = Module._pg_hmac_init = (e, t2, r) => (_pg_hmac_init = Module._pg_hmac_init = wasmExports.pg_hmac_init)(e, t2, r), _pg_hmac_update = Module._pg_hmac_update = (e, t2, r) => (_pg_hmac_update = Module._pg_hmac_update = wasmExports.pg_hmac_update)(e, t2, r), _pg_hmac_final = Module._pg_hmac_final = (e, t2, r) => (_pg_hmac_final = Module._pg_hmac_final = wasmExports.pg_hmac_final)(e, t2, r), _pg_hmac_free = Module._pg_hmac_free = (e) => (_pg_hmac_free = Module._pg_hmac_free = wasmExports.pg_hmac_free)(e), _scram_H = Module._scram_H = (e, t2, r, a2, o4) => (_scram_H = Module._scram_H = wasmExports.scram_H)(e, t2, r, a2, o4), _scram_ClientKey = Module._scram_ClientKey = (e, t2, r, a2, o4) => (_scram_ClientKey = Module._scram_ClientKey = wasmExports.scram_ClientKey)(e, t2, r, a2, o4), _scram_ServerKey = Module._scram_ServerKey = (e, t2, r, a2, o4) => (_scram_ServerKey = Module._scram_ServerKey = wasmExports.scram_ServerKey)(e, t2, r, a2, o4), _scram_build_secret = Module._scram_build_secret = (e, t2, r, a2, o4, s4, l3) => (_scram_build_secret = Module._scram_build_secret = wasmExports.scram_build_secret)(e, t2, r, a2, o4, s4, l3), _palloc_extended = Module._palloc_extended = (e, t2) => (_palloc_extended = Module._palloc_extended = wasmExports.palloc_extended)(e, t2), _appendStringInfoSpaces = Module._appendStringInfoSpaces = (e, t2) => (_appendStringInfoSpaces = Module._appendStringInfoSpaces = wasmExports.appendStringInfoSpaces)(e, t2), _geteuid = Module._geteuid = () => (_geteuid = Module._geteuid = wasmExports.geteuid)(), _pg_encoding_set_invalid = Module._pg_encoding_set_invalid = (e, t2) => (_pg_encoding_set_invalid = Module._pg_encoding_set_invalid = wasmExports.pg_encoding_set_invalid)(e, t2), _pg_encoding_mblen = Module._pg_encoding_mblen = (e, t2) => (_pg_encoding_mblen = Module._pg_encoding_mblen = wasmExports.pg_encoding_mblen)(e, t2), _pg_encoding_dsplen = Module._pg_encoding_dsplen = (e, t2) => (_pg_encoding_dsplen = Module._pg_encoding_dsplen = wasmExports.pg_encoding_dsplen)(e, t2), _pg_encoding_verifymbchar = Module._pg_encoding_verifymbchar = (e, t2, r) => (_pg_encoding_verifymbchar = Module._pg_encoding_verifymbchar = wasmExports.pg_encoding_verifymbchar)(e, t2, r), _pg_encoding_verifymbstr = Module._pg_encoding_verifymbstr = (e, t2, r) => (_pg_encoding_verifymbstr = Module._pg_encoding_verifymbstr = wasmExports.pg_encoding_verifymbstr)(e, t2, r), _pg_encoding_max_length = Module._pg_encoding_max_length = (e) => (_pg_encoding_max_length = Module._pg_encoding_max_length = wasmExports.pg_encoding_max_length)(e), _explicit_bzero = Module._explicit_bzero = (e, t2) => (_explicit_bzero = Module._explicit_bzero = wasmExports.explicit_bzero)(e, t2), _getpeereid = Module._getpeereid = (e, t2, r) => (_getpeereid = Module._getpeereid = wasmExports.getpeereid)(e, t2, r), _pg_inet_net_ntop = Module._pg_inet_net_ntop = (e, t2, r, a2, o4) => (_pg_inet_net_ntop = Module._pg_inet_net_ntop = wasmExports.pg_inet_net_ntop)(e, t2, r, a2, o4), _fcntl = Module._fcntl = (e, t2, r) => (_fcntl = Module._fcntl = wasmExports.fcntl)(e, t2, r), _getcwd = Module._getcwd = (e, t2) => (_getcwd = Module._getcwd = wasmExports.getcwd)(e, t2), _pg_get_user_home_dir = Module._pg_get_user_home_dir = (e, t2, r) => (_pg_get_user_home_dir = Module._pg_get_user_home_dir = wasmExports.pg_get_user_home_dir)(e, t2, r), _pg_popcount_optimized = Module._pg_popcount_optimized = (e, t2) => (_pg_popcount_optimized = Module._pg_popcount_optimized = wasmExports.pg_popcount_optimized)(e, t2), _pg_strong_random = Module._pg_strong_random = (e, t2) => (_pg_strong_random = Module._pg_strong_random = wasmExports.pg_strong_random)(e, t2), _open = Module._open = (e, t2, r) => (_open = Module._open = wasmExports.open)(e, t2, r), _pg_usleep = Module._pg_usleep = (e) => (_pg_usleep = Module._pg_usleep = wasmExports.pg_usleep)(e), _nanosleep = Module._nanosleep = (e, t2) => (_nanosleep = Module._nanosleep = wasmExports.nanosleep)(e, t2), _pg_tolower = Module._pg_tolower = (e) => (_pg_tolower = Module._pg_tolower = wasmExports.pg_tolower)(e), _sigemptyset = Module._sigemptyset = (e) => (_sigemptyset = Module._sigemptyset = wasmExports.sigemptyset)(e), _sigaction = Module._sigaction = (e, t2, r) => (_sigaction = Module._sigaction = wasmExports.sigaction)(e, t2, r), _getpid = Module._getpid = () => (_getpid = Module._getpid = wasmExports.getpid)(), _qsort_arg = Module._qsort_arg = (e, t2, r, a2, o4) => (_qsort_arg = Module._qsort_arg = wasmExports.qsort_arg)(e, t2, r, a2, o4), _snprintf = Module._snprintf = (e, t2, r, a2) => (_snprintf = Module._snprintf = wasmExports.snprintf)(e, t2, r, a2), _pg_strerror_r = Module._pg_strerror_r = (e, t2, r) => (_pg_strerror_r = Module._pg_strerror_r = wasmExports.pg_strerror_r)(e, t2, r), _strerror_r = Module._strerror_r = (e, t2, r) => (_strerror_r = Module._strerror_r = wasmExports.strerror_r)(e, t2, r), _RelationGetNumberOfBlocksInFork = Module._RelationGetNumberOfBlocksInFork = (e, t2) => (_RelationGetNumberOfBlocksInFork = Module._RelationGetNumberOfBlocksInFork = wasmExports.RelationGetNumberOfBlocksInFork)(e, t2), _ExtendBufferedRel = Module._ExtendBufferedRel = (e, t2, r, a2) => (_ExtendBufferedRel = Module._ExtendBufferedRel = wasmExports.ExtendBufferedRel)(e, t2, r, a2), _MarkBufferDirty = Module._MarkBufferDirty = (e) => (_MarkBufferDirty = Module._MarkBufferDirty = wasmExports.MarkBufferDirty)(e), _XLogBeginInsert = Module._XLogBeginInsert = () => (_XLogBeginInsert = Module._XLogBeginInsert = wasmExports.XLogBeginInsert)(), _XLogRegisterData = Module._XLogRegisterData = (e, t2) => (_XLogRegisterData = Module._XLogRegisterData = wasmExports.XLogRegisterData)(e, t2), _XLogInsert = Module._XLogInsert = (e, t2) => (_XLogInsert = Module._XLogInsert = wasmExports.XLogInsert)(e, t2), _UnlockReleaseBuffer = Module._UnlockReleaseBuffer = (e) => (_UnlockReleaseBuffer = Module._UnlockReleaseBuffer = wasmExports.UnlockReleaseBuffer)(e), _brin_build_desc = Module._brin_build_desc = (e) => (_brin_build_desc = Module._brin_build_desc = wasmExports.brin_build_desc)(e), _EnterParallelMode = Module._EnterParallelMode = () => (_EnterParallelMode = Module._EnterParallelMode = wasmExports.EnterParallelMode)(), _CreateParallelContext = Module._CreateParallelContext = (e, t2, r) => (_CreateParallelContext = Module._CreateParallelContext = wasmExports.CreateParallelContext)(e, t2, r), _RegisterSnapshot = Module._RegisterSnapshot = (e) => (_RegisterSnapshot = Module._RegisterSnapshot = wasmExports.RegisterSnapshot)(e), _table_parallelscan_estimate = Module._table_parallelscan_estimate = (e, t2) => (_table_parallelscan_estimate = Module._table_parallelscan_estimate = wasmExports.table_parallelscan_estimate)(e, t2), _add_size = Module._add_size = (e, t2) => (_add_size = Module._add_size = wasmExports.add_size)(e, t2), _tuplesort_estimate_shared = Module._tuplesort_estimate_shared = (e) => (_tuplesort_estimate_shared = Module._tuplesort_estimate_shared = wasmExports.tuplesort_estimate_shared)(e), _InitializeParallelDSM = Module._InitializeParallelDSM = (e) => (_InitializeParallelDSM = Module._InitializeParallelDSM = wasmExports.InitializeParallelDSM)(e), _UnregisterSnapshot = Module._UnregisterSnapshot = (e) => (_UnregisterSnapshot = Module._UnregisterSnapshot = wasmExports.UnregisterSnapshot)(e), _DestroyParallelContext = Module._DestroyParallelContext = (e) => (_DestroyParallelContext = Module._DestroyParallelContext = wasmExports.DestroyParallelContext)(e), _ExitParallelMode = Module._ExitParallelMode = () => (_ExitParallelMode = Module._ExitParallelMode = wasmExports.ExitParallelMode)(), _shm_toc_allocate = Module._shm_toc_allocate = (e, t2) => (_shm_toc_allocate = Module._shm_toc_allocate = wasmExports.shm_toc_allocate)(e, t2), _ConditionVariableInit = Module._ConditionVariableInit = (e) => (_ConditionVariableInit = Module._ConditionVariableInit = wasmExports.ConditionVariableInit)(e), _s_init_lock_sema = Module._s_init_lock_sema = (e, t2) => (_s_init_lock_sema = Module._s_init_lock_sema = wasmExports.s_init_lock_sema)(e, t2), _table_parallelscan_initialize = Module._table_parallelscan_initialize = (e, t2, r) => (_table_parallelscan_initialize = Module._table_parallelscan_initialize = wasmExports.table_parallelscan_initialize)(e, t2, r), _tuplesort_initialize_shared = Module._tuplesort_initialize_shared = (e, t2, r) => (_tuplesort_initialize_shared = Module._tuplesort_initialize_shared = wasmExports.tuplesort_initialize_shared)(e, t2, r), _shm_toc_insert = Module._shm_toc_insert = (e, t2, r) => (_shm_toc_insert = Module._shm_toc_insert = wasmExports.shm_toc_insert)(e, t2, r), _LaunchParallelWorkers = Module._LaunchParallelWorkers = (e) => (_LaunchParallelWorkers = Module._LaunchParallelWorkers = wasmExports.LaunchParallelWorkers)(e), _WaitForParallelWorkersToAttach = Module._WaitForParallelWorkersToAttach = (e) => (_WaitForParallelWorkersToAttach = Module._WaitForParallelWorkersToAttach = wasmExports.WaitForParallelWorkersToAttach)(e), _tas_sema = Module._tas_sema = (e) => (_tas_sema = Module._tas_sema = wasmExports.tas_sema)(e), _s_lock = Module._s_lock = (e, t2, r, a2) => (_s_lock = Module._s_lock = wasmExports.s_lock)(e, t2, r, a2), _s_unlock_sema = Module._s_unlock_sema = (e) => (_s_unlock_sema = Module._s_unlock_sema = wasmExports.s_unlock_sema)(e), _ConditionVariableSleep = Module._ConditionVariableSleep = (e, t2) => (_ConditionVariableSleep = Module._ConditionVariableSleep = wasmExports.ConditionVariableSleep)(e, t2), _ConditionVariableCancelSleep = Module._ConditionVariableCancelSleep = () => (_ConditionVariableCancelSleep = Module._ConditionVariableCancelSleep = wasmExports.ConditionVariableCancelSleep)(), _tuplesort_performsort = Module._tuplesort_performsort = (e) => (_tuplesort_performsort = Module._tuplesort_performsort = wasmExports.tuplesort_performsort)(e), _tuplesort_end = Module._tuplesort_end = (e) => (_tuplesort_end = Module._tuplesort_end = wasmExports.tuplesort_end)(e), _MemoryContextReset = Module._MemoryContextReset = (e) => (_MemoryContextReset = Module._MemoryContextReset = wasmExports.MemoryContextReset)(e), _brin_deform_tuple = Module._brin_deform_tuple = (e, t2, r) => (_brin_deform_tuple = Module._brin_deform_tuple = wasmExports.brin_deform_tuple)(e, t2, r), _log_newpage_buffer = Module._log_newpage_buffer = (e, t2) => (_log_newpage_buffer = Module._log_newpage_buffer = wasmExports.log_newpage_buffer)(e, t2), _LockBuffer = Module._LockBuffer = (e, t2) => (_LockBuffer = Module._LockBuffer = wasmExports.LockBuffer)(e, t2), _ReleaseBuffer = Module._ReleaseBuffer = (e) => (_ReleaseBuffer = Module._ReleaseBuffer = wasmExports.ReleaseBuffer)(e), _IndexGetRelation = Module._IndexGetRelation = (e, t2) => (_IndexGetRelation = Module._IndexGetRelation = wasmExports.IndexGetRelation)(e, t2), _table_open = Module._table_open = (e, t2) => (_table_open = Module._table_open = wasmExports.table_open)(e, t2), _ReadBufferExtended = Module._ReadBufferExtended = (e, t2, r, a2, o4) => (_ReadBufferExtended = Module._ReadBufferExtended = wasmExports.ReadBufferExtended)(e, t2, r, a2, o4), _table_close = Module._table_close = (e, t2) => (_table_close = Module._table_close = wasmExports.table_close)(e, t2), _build_reloptions = Module._build_reloptions = (e, t2, r, a2, o4, s4) => (_build_reloptions = Module._build_reloptions = wasmExports.build_reloptions)(e, t2, r, a2, o4, s4), _RelationGetIndexScan = Module._RelationGetIndexScan = (e, t2, r) => (_RelationGetIndexScan = Module._RelationGetIndexScan = wasmExports.RelationGetIndexScan)(e, t2, r), _pgstat_assoc_relation = Module._pgstat_assoc_relation = (e) => (_pgstat_assoc_relation = Module._pgstat_assoc_relation = wasmExports.pgstat_assoc_relation)(e), _index_getprocinfo = Module._index_getprocinfo = (e, t2, r) => (_index_getprocinfo = Module._index_getprocinfo = wasmExports.index_getprocinfo)(e, t2, r), _fmgr_info_copy = Module._fmgr_info_copy = (e, t2, r) => (_fmgr_info_copy = Module._fmgr_info_copy = wasmExports.fmgr_info_copy)(e, t2, r), _FunctionCall4Coll = Module._FunctionCall4Coll = (e, t2, r, a2, o4, s4) => (_FunctionCall4Coll = Module._FunctionCall4Coll = wasmExports.FunctionCall4Coll)(e, t2, r, a2, o4, s4), _FunctionCall1Coll = Module._FunctionCall1Coll = (e, t2, r) => (_FunctionCall1Coll = Module._FunctionCall1Coll = wasmExports.FunctionCall1Coll)(e, t2, r), _brin_free_desc = Module._brin_free_desc = (e) => (_brin_free_desc = Module._brin_free_desc = wasmExports.brin_free_desc)(e), _WaitForParallelWorkersToFinish = Module._WaitForParallelWorkersToFinish = (e) => (_WaitForParallelWorkersToFinish = Module._WaitForParallelWorkersToFinish = wasmExports.WaitForParallelWorkersToFinish)(e), _PageGetFreeSpace = Module._PageGetFreeSpace = (e) => (_PageGetFreeSpace = Module._PageGetFreeSpace = wasmExports.PageGetFreeSpace)(e), _BufferGetBlockNumber = Module._BufferGetBlockNumber = (e) => (_BufferGetBlockNumber = Module._BufferGetBlockNumber = wasmExports.BufferGetBlockNumber)(e), _BuildIndexInfo = Module._BuildIndexInfo = (e) => (_BuildIndexInfo = Module._BuildIndexInfo = wasmExports.BuildIndexInfo)(e), _Int64GetDatum = Module._Int64GetDatum = (e) => (_Int64GetDatum = Module._Int64GetDatum = wasmExports.Int64GetDatum)(e), _DirectFunctionCall2Coll = Module._DirectFunctionCall2Coll = (e, t2, r, a2) => (_DirectFunctionCall2Coll = Module._DirectFunctionCall2Coll = wasmExports.DirectFunctionCall2Coll)(e, t2, r, a2), _RecoveryInProgress = Module._RecoveryInProgress = () => (_RecoveryInProgress = Module._RecoveryInProgress = wasmExports.RecoveryInProgress)(), _GetUserIdAndSecContext = Module._GetUserIdAndSecContext = (e, t2) => (_GetUserIdAndSecContext = Module._GetUserIdAndSecContext = wasmExports.GetUserIdAndSecContext)(e, t2), _SetUserIdAndSecContext = Module._SetUserIdAndSecContext = (e, t2) => (_SetUserIdAndSecContext = Module._SetUserIdAndSecContext = wasmExports.SetUserIdAndSecContext)(e, t2), _NewGUCNestLevel = Module._NewGUCNestLevel = () => (_NewGUCNestLevel = Module._NewGUCNestLevel = wasmExports.NewGUCNestLevel)(), _RestrictSearchPath = Module._RestrictSearchPath = () => (_RestrictSearchPath = Module._RestrictSearchPath = wasmExports.RestrictSearchPath)(), _index_open = Module._index_open = (e, t2) => (_index_open = Module._index_open = wasmExports.index_open)(e, t2), _object_ownercheck = Module._object_ownercheck = (e, t2, r) => (_object_ownercheck = Module._object_ownercheck = wasmExports.object_ownercheck)(e, t2, r), _aclcheck_error = Module._aclcheck_error = (e, t2, r) => (_aclcheck_error = Module._aclcheck_error = wasmExports.aclcheck_error)(e, t2, r), _AtEOXact_GUC = Module._AtEOXact_GUC = (e, t2) => (_AtEOXact_GUC = Module._AtEOXact_GUC = wasmExports.AtEOXact_GUC)(e, t2), _relation_close = Module._relation_close = (e, t2) => (_relation_close = Module._relation_close = wasmExports.relation_close)(e, t2), _GetUserId = Module._GetUserId = () => (_GetUserId = Module._GetUserId = wasmExports.GetUserId)(), _ReadBuffer = Module._ReadBuffer = (e, t2) => (_ReadBuffer = Module._ReadBuffer = wasmExports.ReadBuffer)(e, t2), _shm_toc_lookup = Module._shm_toc_lookup = (e, t2, r) => (_shm_toc_lookup = Module._shm_toc_lookup = wasmExports.shm_toc_lookup)(e, t2, r), _tuplesort_attach_shared = Module._tuplesort_attach_shared = (e, t2) => (_tuplesort_attach_shared = Module._tuplesort_attach_shared = wasmExports.tuplesort_attach_shared)(e, t2), _index_close = Module._index_close = (e, t2) => (_index_close = Module._index_close = wasmExports.index_close)(e, t2), _table_beginscan_parallel = Module._table_beginscan_parallel = (e, t2) => (_table_beginscan_parallel = Module._table_beginscan_parallel = wasmExports.table_beginscan_parallel)(e, t2), _ConditionVariableSignal = Module._ConditionVariableSignal = (e) => (_ConditionVariableSignal = Module._ConditionVariableSignal = wasmExports.ConditionVariableSignal)(e), _datumCopy = Module._datumCopy = (e, t2, r) => (_datumCopy = Module._datumCopy = wasmExports.datumCopy)(e, t2, r), _lookup_type_cache = Module._lookup_type_cache = (e, t2) => (_lookup_type_cache = Module._lookup_type_cache = wasmExports.lookup_type_cache)(e, t2), _get_fn_opclass_options = Module._get_fn_opclass_options = (e) => (_get_fn_opclass_options = Module._get_fn_opclass_options = wasmExports.get_fn_opclass_options)(e), _pg_detoast_datum = Module._pg_detoast_datum = (e) => (_pg_detoast_datum = Module._pg_detoast_datum = wasmExports.pg_detoast_datum)(e), _index_getprocid = Module._index_getprocid = (e, t2, r) => (_index_getprocid = Module._index_getprocid = wasmExports.index_getprocid)(e, t2, r), _init_local_reloptions = Module._init_local_reloptions = (e, t2) => (_init_local_reloptions = Module._init_local_reloptions = wasmExports.init_local_reloptions)(e, t2), _FunctionCall2Coll = Module._FunctionCall2Coll = (e, t2, r, a2) => (_FunctionCall2Coll = Module._FunctionCall2Coll = wasmExports.FunctionCall2Coll)(e, t2, r, a2), _SysCacheGetAttrNotNull = Module._SysCacheGetAttrNotNull = (e, t2, r) => (_SysCacheGetAttrNotNull = Module._SysCacheGetAttrNotNull = wasmExports.SysCacheGetAttrNotNull)(e, t2, r), _ReleaseSysCache = Module._ReleaseSysCache = (e) => (_ReleaseSysCache = Module._ReleaseSysCache = wasmExports.ReleaseSysCache)(e), _fmgr_info_cxt = Module._fmgr_info_cxt = (e, t2, r) => (_fmgr_info_cxt = Module._fmgr_info_cxt = wasmExports.fmgr_info_cxt)(e, t2, r), _Float8GetDatum = Module._Float8GetDatum = (e) => (_Float8GetDatum = Module._Float8GetDatum = wasmExports.Float8GetDatum)(e), _numeric_sub = Module._numeric_sub = (e) => (_numeric_sub = Module._numeric_sub = wasmExports.numeric_sub)(e), _DirectFunctionCall1Coll = Module._DirectFunctionCall1Coll = (e, t2, r) => (_DirectFunctionCall1Coll = Module._DirectFunctionCall1Coll = wasmExports.DirectFunctionCall1Coll)(e, t2, r), _pg_detoast_datum_packed = Module._pg_detoast_datum_packed = (e) => (_pg_detoast_datum_packed = Module._pg_detoast_datum_packed = wasmExports.pg_detoast_datum_packed)(e), _add_local_int_reloption = Module._add_local_int_reloption = (e, t2, r, a2, o4, s4, l3) => (_add_local_int_reloption = Module._add_local_int_reloption = wasmExports.add_local_int_reloption)(e, t2, r, a2, o4, s4, l3), _getTypeOutputInfo = Module._getTypeOutputInfo = (e, t2, r) => (_getTypeOutputInfo = Module._getTypeOutputInfo = wasmExports.getTypeOutputInfo)(e, t2, r), _fmgr_info = Module._fmgr_info = (e, t2) => (_fmgr_info = Module._fmgr_info = wasmExports.fmgr_info)(e, t2), _OutputFunctionCall = Module._OutputFunctionCall = (e, t2) => (_OutputFunctionCall = Module._OutputFunctionCall = wasmExports.OutputFunctionCall)(e, t2), _cstring_to_text_with_len = Module._cstring_to_text_with_len = (e, t2) => (_cstring_to_text_with_len = Module._cstring_to_text_with_len = wasmExports.cstring_to_text_with_len)(e, t2), _accumArrayResult = Module._accumArrayResult = (e, t2, r, a2, o4) => (_accumArrayResult = Module._accumArrayResult = wasmExports.accumArrayResult)(e, t2, r, a2, o4), _makeArrayResult = Module._makeArrayResult = (e, t2) => (_makeArrayResult = Module._makeArrayResult = wasmExports.makeArrayResult)(e, t2), _OidOutputFunctionCall = Module._OidOutputFunctionCall = (e, t2) => (_OidOutputFunctionCall = Module._OidOutputFunctionCall = wasmExports.OidOutputFunctionCall)(e, t2), _cstring_to_text = Module._cstring_to_text = (e) => (_cstring_to_text = Module._cstring_to_text = wasmExports.cstring_to_text)(e), _PageGetExactFreeSpace = Module._PageGetExactFreeSpace = (e) => (_PageGetExactFreeSpace = Module._PageGetExactFreeSpace = wasmExports.PageGetExactFreeSpace)(e), _PageIndexTupleOverwrite = Module._PageIndexTupleOverwrite = (e, t2, r, a2) => (_PageIndexTupleOverwrite = Module._PageIndexTupleOverwrite = wasmExports.PageIndexTupleOverwrite)(e, t2, r, a2), _PageInit = Module._PageInit = (e, t2, r) => (_PageInit = Module._PageInit = wasmExports.PageInit)(e, t2, r), _PageAddItemExtended = Module._PageAddItemExtended = (e, t2, r, a2, o4) => (_PageAddItemExtended = Module._PageAddItemExtended = wasmExports.PageAddItemExtended)(e, t2, r, a2, o4), _LockRelationForExtension = Module._LockRelationForExtension = (e, t2) => (_LockRelationForExtension = Module._LockRelationForExtension = wasmExports.LockRelationForExtension)(e, t2), _UnlockRelationForExtension = Module._UnlockRelationForExtension = (e, t2) => (_UnlockRelationForExtension = Module._UnlockRelationForExtension = wasmExports.UnlockRelationForExtension)(e, t2), _smgropen = Module._smgropen = (e, t2) => (_smgropen = Module._smgropen = wasmExports.smgropen)(e, t2), _smgrpin = Module._smgrpin = (e) => (_smgrpin = Module._smgrpin = wasmExports.smgrpin)(e), _ItemPointerEquals = Module._ItemPointerEquals = (e, t2) => (_ItemPointerEquals = Module._ItemPointerEquals = wasmExports.ItemPointerEquals)(e, t2), _detoast_external_attr = Module._detoast_external_attr = (e) => (_detoast_external_attr = Module._detoast_external_attr = wasmExports.detoast_external_attr)(e), _CreateTemplateTupleDesc = Module._CreateTemplateTupleDesc = (e) => (_CreateTemplateTupleDesc = Module._CreateTemplateTupleDesc = wasmExports.CreateTemplateTupleDesc)(e), _TupleDescInitEntry = Module._TupleDescInitEntry = (e, t2, r, a2, o4, s4) => (_TupleDescInitEntry = Module._TupleDescInitEntry = wasmExports.TupleDescInitEntry)(e, t2, r, a2, o4, s4), _SearchSysCache1 = Module._SearchSysCache1 = (e, t2) => (_SearchSysCache1 = Module._SearchSysCache1 = wasmExports.SearchSysCache1)(e, t2), _SearchSysCacheList = Module._SearchSysCacheList = (e, t2, r, a2, o4) => (_SearchSysCacheList = Module._SearchSysCacheList = wasmExports.SearchSysCacheList)(e, t2, r, a2, o4), _check_amproc_signature = Module._check_amproc_signature = (e, t2, r, a2, o4, s4) => (_check_amproc_signature = Module._check_amproc_signature = wasmExports.check_amproc_signature)(e, t2, r, a2, o4, s4), _check_amoptsproc_signature = Module._check_amoptsproc_signature = (e) => (_check_amoptsproc_signature = Module._check_amoptsproc_signature = wasmExports.check_amoptsproc_signature)(e), _format_procedure = Module._format_procedure = (e) => (_format_procedure = Module._format_procedure = wasmExports.format_procedure)(e), _format_operator = Module._format_operator = (e) => (_format_operator = Module._format_operator = wasmExports.format_operator)(e), _check_amop_signature = Module._check_amop_signature = (e, t2, r, a2) => (_check_amop_signature = Module._check_amop_signature = wasmExports.check_amop_signature)(e, t2, r, a2), _identify_opfamily_groups = Module._identify_opfamily_groups = (e, t2) => (_identify_opfamily_groups = Module._identify_opfamily_groups = wasmExports.identify_opfamily_groups)(e, t2), _format_type_be = Module._format_type_be = (e) => (_format_type_be = Module._format_type_be = wasmExports.format_type_be)(e), _ReleaseCatCacheList = Module._ReleaseCatCacheList = (e) => (_ReleaseCatCacheList = Module._ReleaseCatCacheList = wasmExports.ReleaseCatCacheList)(e), _free_attrmap = Module._free_attrmap = (e) => (_free_attrmap = Module._free_attrmap = wasmExports.free_attrmap)(e), _format_type_with_typemod = Module._format_type_with_typemod = (e, t2) => (_format_type_with_typemod = Module._format_type_with_typemod = wasmExports.format_type_with_typemod)(e, t2), _build_attrmap_by_name_if_req = Module._build_attrmap_by_name_if_req = (e, t2, r) => (_build_attrmap_by_name_if_req = Module._build_attrmap_by_name_if_req = wasmExports.build_attrmap_by_name_if_req)(e, t2, r), _DatumGetEOHP = Module._DatumGetEOHP = (e) => (_DatumGetEOHP = Module._DatumGetEOHP = wasmExports.DatumGetEOHP)(e), _EOH_get_flat_size = Module._EOH_get_flat_size = (e) => (_EOH_get_flat_size = Module._EOH_get_flat_size = wasmExports.EOH_get_flat_size)(e), _EOH_flatten_into = Module._EOH_flatten_into = (e, t2, r) => (_EOH_flatten_into = Module._EOH_flatten_into = wasmExports.EOH_flatten_into)(e, t2, r), _getmissingattr = Module._getmissingattr = (e, t2, r) => (_getmissingattr = Module._getmissingattr = wasmExports.getmissingattr)(e, t2, r), _hash_create = Module._hash_create = (e, t2, r, a2) => (_hash_create = Module._hash_create = wasmExports.hash_create)(e, t2, r, a2), _hash_search = Module._hash_search = (e, t2, r, a2) => (_hash_search = Module._hash_search = wasmExports.hash_search)(e, t2, r, a2), _nocachegetattr = Module._nocachegetattr = (e, t2, r) => (_nocachegetattr = Module._nocachegetattr = wasmExports.nocachegetattr)(e, t2, r), _heap_form_tuple = Module._heap_form_tuple = (e, t2, r) => (_heap_form_tuple = Module._heap_form_tuple = wasmExports.heap_form_tuple)(e, t2, r), _heap_modify_tuple = Module._heap_modify_tuple = (e, t2, r, a2, o4) => (_heap_modify_tuple = Module._heap_modify_tuple = wasmExports.heap_modify_tuple)(e, t2, r, a2, o4), _heap_deform_tuple = Module._heap_deform_tuple = (e, t2, r, a2) => (_heap_deform_tuple = Module._heap_deform_tuple = wasmExports.heap_deform_tuple)(e, t2, r, a2), _heap_modify_tuple_by_cols = Module._heap_modify_tuple_by_cols = (e, t2, r, a2, o4, s4) => (_heap_modify_tuple_by_cols = Module._heap_modify_tuple_by_cols = wasmExports.heap_modify_tuple_by_cols)(e, t2, r, a2, o4, s4), _heap_freetuple = Module._heap_freetuple = (e) => (_heap_freetuple = Module._heap_freetuple = wasmExports.heap_freetuple)(e), _index_form_tuple = Module._index_form_tuple = (e, t2, r) => (_index_form_tuple = Module._index_form_tuple = wasmExports.index_form_tuple)(e, t2, r), _nocache_index_getattr = Module._nocache_index_getattr = (e, t2, r) => (_nocache_index_getattr = Module._nocache_index_getattr = wasmExports.nocache_index_getattr)(e, t2, r), _index_deform_tuple = Module._index_deform_tuple = (e, t2, r, a2) => (_index_deform_tuple = Module._index_deform_tuple = wasmExports.index_deform_tuple)(e, t2, r, a2), _slot_getsomeattrs_int = Module._slot_getsomeattrs_int = (e, t2) => (_slot_getsomeattrs_int = Module._slot_getsomeattrs_int = wasmExports.slot_getsomeattrs_int)(e, t2), _pg_ltoa = Module._pg_ltoa = (e, t2) => (_pg_ltoa = Module._pg_ltoa = wasmExports.pg_ltoa)(e, t2), _relation_open = Module._relation_open = (e, t2) => (_relation_open = Module._relation_open = wasmExports.relation_open)(e, t2), _LockRelationOid = Module._LockRelationOid = (e, t2) => (_LockRelationOid = Module._LockRelationOid = wasmExports.LockRelationOid)(e, t2), _RelationIdGetRelation = Module._RelationIdGetRelation = (e) => (_RelationIdGetRelation = Module._RelationIdGetRelation = wasmExports.RelationIdGetRelation)(e), _try_relation_open = Module._try_relation_open = (e, t2) => (_try_relation_open = Module._try_relation_open = wasmExports.try_relation_open)(e, t2), _SearchSysCacheExists = Module._SearchSysCacheExists = (e, t2, r, a2, o4) => (_SearchSysCacheExists = Module._SearchSysCacheExists = wasmExports.SearchSysCacheExists)(e, t2, r, a2, o4), _relation_openrv = Module._relation_openrv = (e, t2) => (_relation_openrv = Module._relation_openrv = wasmExports.relation_openrv)(e, t2), _RangeVarGetRelidExtended = Module._RangeVarGetRelidExtended = (e, t2, r, a2, o4) => (_RangeVarGetRelidExtended = Module._RangeVarGetRelidExtended = wasmExports.RangeVarGetRelidExtended)(e, t2, r, a2, o4), _RelationClose = Module._RelationClose = (e) => (_RelationClose = Module._RelationClose = wasmExports.RelationClose)(e), _add_reloption_kind = Module._add_reloption_kind = () => (_add_reloption_kind = Module._add_reloption_kind = wasmExports.add_reloption_kind)(), _register_reloptions_validator = Module._register_reloptions_validator = (e, t2) => (_register_reloptions_validator = Module._register_reloptions_validator = wasmExports.register_reloptions_validator)(e, t2), _add_int_reloption = Module._add_int_reloption = (e, t2, r, a2, o4, s4, l3) => (_add_int_reloption = Module._add_int_reloption = wasmExports.add_int_reloption)(e, t2, r, a2, o4, s4, l3), _MemoryContextStrdup = Module._MemoryContextStrdup = (e, t2) => (_MemoryContextStrdup = Module._MemoryContextStrdup = wasmExports.MemoryContextStrdup)(e, t2), _transformRelOptions = Module._transformRelOptions = (e, t2, r, a2, o4, s4) => (_transformRelOptions = Module._transformRelOptions = wasmExports.transformRelOptions)(e, t2, r, a2, o4, s4), _deconstruct_array_builtin = Module._deconstruct_array_builtin = (e, t2, r, a2, o4) => (_deconstruct_array_builtin = Module._deconstruct_array_builtin = wasmExports.deconstruct_array_builtin)(e, t2, r, a2, o4), _defGetString = Module._defGetString = (e) => (_defGetString = Module._defGetString = wasmExports.defGetString)(e), _defGetBoolean = Module._defGetBoolean = (e) => (_defGetBoolean = Module._defGetBoolean = wasmExports.defGetBoolean)(e), _untransformRelOptions = Module._untransformRelOptions = (e) => (_untransformRelOptions = Module._untransformRelOptions = wasmExports.untransformRelOptions)(e), _text_to_cstring = Module._text_to_cstring = (e) => (_text_to_cstring = Module._text_to_cstring = wasmExports.text_to_cstring)(e), _makeString = Module._makeString = (e) => (_makeString = Module._makeString = wasmExports.makeString)(e), _makeDefElem = Module._makeDefElem = (e, t2, r) => (_makeDefElem = Module._makeDefElem = wasmExports.makeDefElem)(e, t2, r), _heap_reloptions = Module._heap_reloptions = (e, t2, r) => (_heap_reloptions = Module._heap_reloptions = wasmExports.heap_reloptions)(e, t2, r), _MemoryContextAlloc = Module._MemoryContextAlloc = (e, t2) => (_MemoryContextAlloc = Module._MemoryContextAlloc = wasmExports.MemoryContextAlloc)(e, t2), _parse_bool = Module._parse_bool = (e, t2) => (_parse_bool = Module._parse_bool = wasmExports.parse_bool)(e, t2), _parse_int = Module._parse_int = (e, t2, r, a2) => (_parse_int = Module._parse_int = wasmExports.parse_int)(e, t2, r, a2), _parse_real = Module._parse_real = (e, t2, r, a2) => (_parse_real = Module._parse_real = wasmExports.parse_real)(e, t2, r, a2), _ScanKeyInit = Module._ScanKeyInit = (e, t2, r, a2, o4) => (_ScanKeyInit = Module._ScanKeyInit = wasmExports.ScanKeyInit)(e, t2, r, a2, o4), _dsm_segment_handle = Module._dsm_segment_handle = (e) => (_dsm_segment_handle = Module._dsm_segment_handle = wasmExports.dsm_segment_handle)(e), _dsm_create = Module._dsm_create = (e, t2) => (_dsm_create = Module._dsm_create = wasmExports.dsm_create)(e, t2), _dsm_segment_address = Module._dsm_segment_address = (e) => (_dsm_segment_address = Module._dsm_segment_address = wasmExports.dsm_segment_address)(e), _dsm_attach = Module._dsm_attach = (e) => (_dsm_attach = Module._dsm_attach = wasmExports.dsm_attach)(e), _dsm_detach = Module._dsm_detach = (e) => (_dsm_detach = Module._dsm_detach = wasmExports.dsm_detach)(e), _ShmemInitStruct = Module._ShmemInitStruct = (e, t2, r) => (_ShmemInitStruct = Module._ShmemInitStruct = wasmExports.ShmemInitStruct)(e, t2, r), _LWLockAcquire = Module._LWLockAcquire = (e, t2) => (_LWLockAcquire = Module._LWLockAcquire = wasmExports.LWLockAcquire)(e, t2), _LWLockRelease = Module._LWLockRelease = (e) => (_LWLockRelease = Module._LWLockRelease = wasmExports.LWLockRelease)(e), _LWLockInitialize = Module._LWLockInitialize = (e, t2) => (_LWLockInitialize = Module._LWLockInitialize = wasmExports.LWLockInitialize)(e, t2), _MemoryContextMemAllocated = Module._MemoryContextMemAllocated = (e, t2) => (_MemoryContextMemAllocated = Module._MemoryContextMemAllocated = wasmExports.MemoryContextMemAllocated)(e, t2), _GetCurrentCommandId = Module._GetCurrentCommandId = (e) => (_GetCurrentCommandId = Module._GetCurrentCommandId = wasmExports.GetCurrentCommandId)(e), _toast_open_indexes = Module._toast_open_indexes = (e, t2, r, a2) => (_toast_open_indexes = Module._toast_open_indexes = wasmExports.toast_open_indexes)(e, t2, r, a2), _RelationGetIndexList = Module._RelationGetIndexList = (e) => (_RelationGetIndexList = Module._RelationGetIndexList = wasmExports.RelationGetIndexList)(e), _systable_beginscan = Module._systable_beginscan = (e, t2, r, a2, o4, s4) => (_systable_beginscan = Module._systable_beginscan = wasmExports.systable_beginscan)(e, t2, r, a2, o4, s4), _systable_getnext = Module._systable_getnext = (e) => (_systable_getnext = Module._systable_getnext = wasmExports.systable_getnext)(e), _systable_endscan = Module._systable_endscan = (e) => (_systable_endscan = Module._systable_endscan = wasmExports.systable_endscan)(e), _toast_close_indexes = Module._toast_close_indexes = (e, t2, r) => (_toast_close_indexes = Module._toast_close_indexes = wasmExports.toast_close_indexes)(e, t2, r), _systable_beginscan_ordered = Module._systable_beginscan_ordered = (e, t2, r, a2, o4) => (_systable_beginscan_ordered = Module._systable_beginscan_ordered = wasmExports.systable_beginscan_ordered)(e, t2, r, a2, o4), _systable_getnext_ordered = Module._systable_getnext_ordered = (e, t2) => (_systable_getnext_ordered = Module._systable_getnext_ordered = wasmExports.systable_getnext_ordered)(e, t2), _systable_endscan_ordered = Module._systable_endscan_ordered = (e) => (_systable_endscan_ordered = Module._systable_endscan_ordered = wasmExports.systable_endscan_ordered)(e), _init_toast_snapshot = Module._init_toast_snapshot = (e) => (_init_toast_snapshot = Module._init_toast_snapshot = wasmExports.init_toast_snapshot)(e), _convert_tuples_by_position = Module._convert_tuples_by_position = (e, t2, r) => (_convert_tuples_by_position = Module._convert_tuples_by_position = wasmExports.convert_tuples_by_position)(e, t2, r), _execute_attr_map_tuple = Module._execute_attr_map_tuple = (e, t2) => (_execute_attr_map_tuple = Module._execute_attr_map_tuple = wasmExports.execute_attr_map_tuple)(e, t2), _execute_attr_map_slot = Module._execute_attr_map_slot = (e, t2, r) => (_execute_attr_map_slot = Module._execute_attr_map_slot = wasmExports.execute_attr_map_slot)(e, t2, r), _ExecStoreVirtualTuple = Module._ExecStoreVirtualTuple = (e) => (_ExecStoreVirtualTuple = Module._ExecStoreVirtualTuple = wasmExports.ExecStoreVirtualTuple)(e), _bms_is_member = Module._bms_is_member = (e, t2) => (_bms_is_member = Module._bms_is_member = wasmExports.bms_is_member)(e, t2), _bms_add_member = Module._bms_add_member = (e, t2) => (_bms_add_member = Module._bms_add_member = wasmExports.bms_add_member)(e, t2), _CreateTupleDescCopy = Module._CreateTupleDescCopy = (e) => (_CreateTupleDescCopy = Module._CreateTupleDescCopy = wasmExports.CreateTupleDescCopy)(e), _CreateTupleDescCopyConstr = Module._CreateTupleDescCopyConstr = (e) => (_CreateTupleDescCopyConstr = Module._CreateTupleDescCopyConstr = wasmExports.CreateTupleDescCopyConstr)(e), _FreeTupleDesc = Module._FreeTupleDesc = (e) => (_FreeTupleDesc = Module._FreeTupleDesc = wasmExports.FreeTupleDesc)(e), _ResourceOwnerEnlarge = Module._ResourceOwnerEnlarge = (e) => (_ResourceOwnerEnlarge = Module._ResourceOwnerEnlarge = wasmExports.ResourceOwnerEnlarge)(e), _ResourceOwnerRemember = Module._ResourceOwnerRemember = (e, t2, r) => (_ResourceOwnerRemember = Module._ResourceOwnerRemember = wasmExports.ResourceOwnerRemember)(e, t2, r), _DecrTupleDescRefCount = Module._DecrTupleDescRefCount = (e) => (_DecrTupleDescRefCount = Module._DecrTupleDescRefCount = wasmExports.DecrTupleDescRefCount)(e), _ResourceOwnerForget = Module._ResourceOwnerForget = (e, t2, r) => (_ResourceOwnerForget = Module._ResourceOwnerForget = wasmExports.ResourceOwnerForget)(e, t2, r), _datumIsEqual = Module._datumIsEqual = (e, t2, r, a2) => (_datumIsEqual = Module._datumIsEqual = wasmExports.datumIsEqual)(e, t2, r, a2), _TupleDescInitEntryCollation = Module._TupleDescInitEntryCollation = (e, t2, r) => (_TupleDescInitEntryCollation = Module._TupleDescInitEntryCollation = wasmExports.TupleDescInitEntryCollation)(e, t2, r), _stringToNode = Module._stringToNode = (e) => (_stringToNode = Module._stringToNode = wasmExports.stringToNode)(e), _pg_detoast_datum_copy = Module._pg_detoast_datum_copy = (e) => (_pg_detoast_datum_copy = Module._pg_detoast_datum_copy = wasmExports.pg_detoast_datum_copy)(e), _get_typlenbyvalalign = Module._get_typlenbyvalalign = (e, t2, r, a2) => (_get_typlenbyvalalign = Module._get_typlenbyvalalign = wasmExports.get_typlenbyvalalign)(e, t2, r, a2), _deconstruct_array = Module._deconstruct_array = (e, t2, r, a2, o4, s4, l3, _3) => (_deconstruct_array = Module._deconstruct_array = wasmExports.deconstruct_array)(e, t2, r, a2, o4, s4, l3, _3), _tbm_add_tuples = Module._tbm_add_tuples = (e, t2, r, a2) => (_tbm_add_tuples = Module._tbm_add_tuples = wasmExports.tbm_add_tuples)(e, t2, r, a2), _ginPostingListDecode = Module._ginPostingListDecode = (e, t2) => (_ginPostingListDecode = Module._ginPostingListDecode = wasmExports.ginPostingListDecode)(e, t2), _ItemPointerCompare = Module._ItemPointerCompare = (e, t2) => (_ItemPointerCompare = Module._ItemPointerCompare = wasmExports.ItemPointerCompare)(e, t2), _LockPage = Module._LockPage = (e, t2, r) => (_LockPage = Module._LockPage = wasmExports.LockPage)(e, t2, r), _UnlockPage = Module._UnlockPage = (e, t2, r) => (_UnlockPage = Module._UnlockPage = wasmExports.UnlockPage)(e, t2, r), _vacuum_delay_point = Module._vacuum_delay_point = () => (_vacuum_delay_point = Module._vacuum_delay_point = wasmExports.vacuum_delay_point)(), _RecordFreeIndexPage = Module._RecordFreeIndexPage = (e, t2) => (_RecordFreeIndexPage = Module._RecordFreeIndexPage = wasmExports.RecordFreeIndexPage)(e, t2), _IndexFreeSpaceMapVacuum = Module._IndexFreeSpaceMapVacuum = (e) => (_IndexFreeSpaceMapVacuum = Module._IndexFreeSpaceMapVacuum = wasmExports.IndexFreeSpaceMapVacuum)(e), _log_newpage_range = Module._log_newpage_range = (e, t2, r, a2, o4) => (_log_newpage_range = Module._log_newpage_range = wasmExports.log_newpage_range)(e, t2, r, a2, o4), _GetFreeIndexPage = Module._GetFreeIndexPage = (e) => (_GetFreeIndexPage = Module._GetFreeIndexPage = wasmExports.GetFreeIndexPage)(e), _ConditionalLockBuffer = Module._ConditionalLockBuffer = (e) => (_ConditionalLockBuffer = Module._ConditionalLockBuffer = wasmExports.ConditionalLockBuffer)(e), _LockBufferForCleanup = Module._LockBufferForCleanup = (e) => (_LockBufferForCleanup = Module._LockBufferForCleanup = wasmExports.LockBufferForCleanup)(e), _gistcheckpage = Module._gistcheckpage = (e, t2) => (_gistcheckpage = Module._gistcheckpage = wasmExports.gistcheckpage)(e, t2), _PageIndexMultiDelete = Module._PageIndexMultiDelete = (e, t2, r) => (_PageIndexMultiDelete = Module._PageIndexMultiDelete = wasmExports.PageIndexMultiDelete)(e, t2, r), _pow = Module._pow = (e, t2) => (_pow = Module._pow = wasmExports.pow)(e, t2), _smgrnblocks = Module._smgrnblocks = (e, t2) => (_smgrnblocks = Module._smgrnblocks = wasmExports.smgrnblocks)(e, t2), _list_free_deep = Module._list_free_deep = (e) => (_list_free_deep = Module._list_free_deep = wasmExports.list_free_deep)(e), _pairingheap_remove_first = Module._pairingheap_remove_first = (e) => (_pairingheap_remove_first = Module._pairingheap_remove_first = wasmExports.pairingheap_remove_first)(e), _pairingheap_add = Module._pairingheap_add = (e, t2) => (_pairingheap_add = Module._pairingheap_add = wasmExports.pairingheap_add)(e, t2), _float_overflow_error = Module._float_overflow_error = () => (_float_overflow_error = Module._float_overflow_error = wasmExports.float_overflow_error)(), _float_underflow_error = Module._float_underflow_error = () => (_float_underflow_error = Module._float_underflow_error = wasmExports.float_underflow_error)(), _DirectFunctionCall5Coll = Module._DirectFunctionCall5Coll = (e, t2, r, a2, o4, s4, l3) => (_DirectFunctionCall5Coll = Module._DirectFunctionCall5Coll = wasmExports.DirectFunctionCall5Coll)(e, t2, r, a2, o4, s4, l3), _pairingheap_allocate = Module._pairingheap_allocate = (e, t2) => (_pairingheap_allocate = Module._pairingheap_allocate = wasmExports.pairingheap_allocate)(e, t2), _GenerationContextCreate = Module._GenerationContextCreate = (e, t2, r, a2, o4) => (_GenerationContextCreate = Module._GenerationContextCreate = wasmExports.GenerationContextCreate)(e, t2, r, a2, o4), _pgstat_progress_update_param = Module._pgstat_progress_update_param = (e, t2) => (_pgstat_progress_update_param = Module._pgstat_progress_update_param = wasmExports.pgstat_progress_update_param)(e, t2), __hash_getbuf = Module.__hash_getbuf = (e, t2, r, a2) => (__hash_getbuf = Module.__hash_getbuf = wasmExports._hash_getbuf)(e, t2, r, a2), __hash_relbuf = Module.__hash_relbuf = (e, t2) => (__hash_relbuf = Module.__hash_relbuf = wasmExports._hash_relbuf)(e, t2), __hash_get_indextuple_hashkey = Module.__hash_get_indextuple_hashkey = (e) => (__hash_get_indextuple_hashkey = Module.__hash_get_indextuple_hashkey = wasmExports._hash_get_indextuple_hashkey)(e), __hash_getbuf_with_strategy = Module.__hash_getbuf_with_strategy = (e, t2, r, a2, o4) => (__hash_getbuf_with_strategy = Module.__hash_getbuf_with_strategy = wasmExports._hash_getbuf_with_strategy)(e, t2, r, a2, o4), __hash_ovflblkno_to_bitno = Module.__hash_ovflblkno_to_bitno = (e, t2) => (__hash_ovflblkno_to_bitno = Module.__hash_ovflblkno_to_bitno = wasmExports._hash_ovflblkno_to_bitno)(e, t2), _hash_destroy = Module._hash_destroy = (e) => (_hash_destroy = Module._hash_destroy = wasmExports.hash_destroy)(e), _list_member_oid = Module._list_member_oid = (e, t2) => (_list_member_oid = Module._list_member_oid = wasmExports.list_member_oid)(e, t2), _HeapTupleSatisfiesVisibility = Module._HeapTupleSatisfiesVisibility = (e, t2, r) => (_HeapTupleSatisfiesVisibility = Module._HeapTupleSatisfiesVisibility = wasmExports.HeapTupleSatisfiesVisibility)(e, t2, r), _read_stream_begin_relation = Module._read_stream_begin_relation = (e, t2, r, a2, o4, s4, l3) => (_read_stream_begin_relation = Module._read_stream_begin_relation = wasmExports.read_stream_begin_relation)(e, t2, r, a2, o4, s4, l3), _GetAccessStrategy = Module._GetAccessStrategy = (e) => (_GetAccessStrategy = Module._GetAccessStrategy = wasmExports.GetAccessStrategy)(e), _FreeAccessStrategy = Module._FreeAccessStrategy = (e) => (_FreeAccessStrategy = Module._FreeAccessStrategy = wasmExports.FreeAccessStrategy)(e), _read_stream_end = Module._read_stream_end = (e) => (_read_stream_end = Module._read_stream_end = wasmExports.read_stream_end)(e), _heap_getnext = Module._heap_getnext = (e, t2) => (_heap_getnext = Module._heap_getnext = wasmExports.heap_getnext)(e, t2), _HeapTupleSatisfiesVacuum = Module._HeapTupleSatisfiesVacuum = (e, t2, r) => (_HeapTupleSatisfiesVacuum = Module._HeapTupleSatisfiesVacuum = wasmExports.HeapTupleSatisfiesVacuum)(e, t2, r), _GetMultiXactIdMembers = Module._GetMultiXactIdMembers = (e, t2, r, a2) => (_GetMultiXactIdMembers = Module._GetMultiXactIdMembers = wasmExports.GetMultiXactIdMembers)(e, t2, r, a2), _TransactionIdPrecedes = Module._TransactionIdPrecedes = (e, t2) => (_TransactionIdPrecedes = Module._TransactionIdPrecedes = wasmExports.TransactionIdPrecedes)(e, t2), _HeapTupleGetUpdateXid = Module._HeapTupleGetUpdateXid = (e) => (_HeapTupleGetUpdateXid = Module._HeapTupleGetUpdateXid = wasmExports.HeapTupleGetUpdateXid)(e), _visibilitymap_clear = Module._visibilitymap_clear = (e, t2, r, a2) => (_visibilitymap_clear = Module._visibilitymap_clear = wasmExports.visibilitymap_clear)(e, t2, r, a2), _pgstat_count_heap_insert = Module._pgstat_count_heap_insert = (e, t2) => (_pgstat_count_heap_insert = Module._pgstat_count_heap_insert = wasmExports.pgstat_count_heap_insert)(e, t2), _ExecFetchSlotHeapTuple = Module._ExecFetchSlotHeapTuple = (e, t2, r) => (_ExecFetchSlotHeapTuple = Module._ExecFetchSlotHeapTuple = wasmExports.ExecFetchSlotHeapTuple)(e, t2, r), _PageGetHeapFreeSpace = Module._PageGetHeapFreeSpace = (e) => (_PageGetHeapFreeSpace = Module._PageGetHeapFreeSpace = wasmExports.PageGetHeapFreeSpace)(e), _visibilitymap_pin = Module._visibilitymap_pin = (e, t2, r) => (_visibilitymap_pin = Module._visibilitymap_pin = wasmExports.visibilitymap_pin)(e, t2, r), _HeapTupleSatisfiesUpdate = Module._HeapTupleSatisfiesUpdate = (e, t2, r) => (_HeapTupleSatisfiesUpdate = Module._HeapTupleSatisfiesUpdate = wasmExports.HeapTupleSatisfiesUpdate)(e, t2, r), _TransactionIdIsCurrentTransactionId = Module._TransactionIdIsCurrentTransactionId = (e) => (_TransactionIdIsCurrentTransactionId = Module._TransactionIdIsCurrentTransactionId = wasmExports.TransactionIdIsCurrentTransactionId)(e), _TransactionIdDidCommit = Module._TransactionIdDidCommit = (e) => (_TransactionIdDidCommit = Module._TransactionIdDidCommit = wasmExports.TransactionIdDidCommit)(e), _TransactionIdIsInProgress = Module._TransactionIdIsInProgress = (e) => (_TransactionIdIsInProgress = Module._TransactionIdIsInProgress = wasmExports.TransactionIdIsInProgress)(e), _bms_free = Module._bms_free = (e) => (_bms_free = Module._bms_free = wasmExports.bms_free)(e), _bms_add_members = Module._bms_add_members = (e, t2) => (_bms_add_members = Module._bms_add_members = wasmExports.bms_add_members)(e, t2), _bms_next_member = Module._bms_next_member = (e, t2) => (_bms_next_member = Module._bms_next_member = wasmExports.bms_next_member)(e, t2), _bms_overlap = Module._bms_overlap = (e, t2) => (_bms_overlap = Module._bms_overlap = wasmExports.bms_overlap)(e, t2), _MultiXactIdPrecedes = Module._MultiXactIdPrecedes = (e, t2) => (_MultiXactIdPrecedes = Module._MultiXactIdPrecedes = wasmExports.MultiXactIdPrecedes)(e, t2), _heap_tuple_needs_eventual_freeze = Module._heap_tuple_needs_eventual_freeze = (e) => (_heap_tuple_needs_eventual_freeze = Module._heap_tuple_needs_eventual_freeze = wasmExports.heap_tuple_needs_eventual_freeze)(e), _PrefetchBuffer = Module._PrefetchBuffer = (e, t2, r, a2) => (_PrefetchBuffer = Module._PrefetchBuffer = wasmExports.PrefetchBuffer)(e, t2, r, a2), _XLogRecGetBlockTagExtended = Module._XLogRecGetBlockTagExtended = (e, t2, r, a2, o4, s4) => (_XLogRecGetBlockTagExtended = Module._XLogRecGetBlockTagExtended = wasmExports.XLogRecGetBlockTagExtended)(e, t2, r, a2, o4, s4), _read_stream_next_buffer = Module._read_stream_next_buffer = (e, t2) => (_read_stream_next_buffer = Module._read_stream_next_buffer = wasmExports.read_stream_next_buffer)(e, t2), _smgrexists = Module._smgrexists = (e, t2) => (_smgrexists = Module._smgrexists = wasmExports.smgrexists)(e, t2), _table_slot_create = Module._table_slot_create = (e, t2) => (_table_slot_create = Module._table_slot_create = wasmExports.table_slot_create)(e, t2), _ExecDropSingleTupleTableSlot = Module._ExecDropSingleTupleTableSlot = (e) => (_ExecDropSingleTupleTableSlot = Module._ExecDropSingleTupleTableSlot = wasmExports.ExecDropSingleTupleTableSlot)(e), _CreateExecutorState = Module._CreateExecutorState = () => (_CreateExecutorState = Module._CreateExecutorState = wasmExports.CreateExecutorState)(), _MakePerTupleExprContext = Module._MakePerTupleExprContext = (e) => (_MakePerTupleExprContext = Module._MakePerTupleExprContext = wasmExports.MakePerTupleExprContext)(e), _GetOldestNonRemovableTransactionId = Module._GetOldestNonRemovableTransactionId = (e) => (_GetOldestNonRemovableTransactionId = Module._GetOldestNonRemovableTransactionId = wasmExports.GetOldestNonRemovableTransactionId)(e), _FreeExecutorState = Module._FreeExecutorState = (e) => (_FreeExecutorState = Module._FreeExecutorState = wasmExports.FreeExecutorState)(e), _MakeSingleTupleTableSlot = Module._MakeSingleTupleTableSlot = (e, t2) => (_MakeSingleTupleTableSlot = Module._MakeSingleTupleTableSlot = wasmExports.MakeSingleTupleTableSlot)(e, t2), _ExecStoreHeapTuple = Module._ExecStoreHeapTuple = (e, t2, r) => (_ExecStoreHeapTuple = Module._ExecStoreHeapTuple = wasmExports.ExecStoreHeapTuple)(e, t2, r), _visibilitymap_get_status = Module._visibilitymap_get_status = (e, t2, r) => (_visibilitymap_get_status = Module._visibilitymap_get_status = wasmExports.visibilitymap_get_status)(e, t2, r), _ExecStoreAllNullTuple = Module._ExecStoreAllNullTuple = (e) => (_ExecStoreAllNullTuple = Module._ExecStoreAllNullTuple = wasmExports.ExecStoreAllNullTuple)(e), _XidInMVCCSnapshot = Module._XidInMVCCSnapshot = (e, t2) => (_XidInMVCCSnapshot = Module._XidInMVCCSnapshot = wasmExports.XidInMVCCSnapshot)(e, t2), _hash_seq_init = Module._hash_seq_init = (e, t2) => (_hash_seq_init = Module._hash_seq_init = wasmExports.hash_seq_init)(e, t2), _hash_seq_search = Module._hash_seq_search = (e) => (_hash_seq_search = Module._hash_seq_search = wasmExports.hash_seq_search)(e), _ftruncate = Module._ftruncate = (e, t2) => (_ftruncate = Module._ftruncate = wasmExports.ftruncate)(e, t2), _fd_fsync_fname = Module._fd_fsync_fname = (e, t2) => (_fd_fsync_fname = Module._fd_fsync_fname = wasmExports.fd_fsync_fname)(e, t2), _get_namespace_name = Module._get_namespace_name = (e) => (_get_namespace_name = Module._get_namespace_name = wasmExports.get_namespace_name)(e), _GetRecordedFreeSpace = Module._GetRecordedFreeSpace = (e, t2) => (_GetRecordedFreeSpace = Module._GetRecordedFreeSpace = wasmExports.GetRecordedFreeSpace)(e, t2), _vac_estimate_reltuples = Module._vac_estimate_reltuples = (e, t2, r, a2) => (_vac_estimate_reltuples = Module._vac_estimate_reltuples = wasmExports.vac_estimate_reltuples)(e, t2, r, a2), _WaitLatch = Module._WaitLatch = (e, t2, r, a2) => (_WaitLatch = Module._WaitLatch = wasmExports.WaitLatch)(e, t2, r, a2), _ResetLatch = Module._ResetLatch = (e) => (_ResetLatch = Module._ResetLatch = wasmExports.ResetLatch)(e), _clock_gettime = Module._clock_gettime = (e, t2) => (_clock_gettime = Module._clock_gettime = wasmExports.clock_gettime)(e, t2), _WalUsageAccumDiff = Module._WalUsageAccumDiff = (e, t2, r) => (_WalUsageAccumDiff = Module._WalUsageAccumDiff = wasmExports.WalUsageAccumDiff)(e, t2, r), _BufferUsageAccumDiff = Module._BufferUsageAccumDiff = (e, t2, r) => (_BufferUsageAccumDiff = Module._BufferUsageAccumDiff = wasmExports.BufferUsageAccumDiff)(e, t2, r), _visibilitymap_prepare_truncate = Module._visibilitymap_prepare_truncate = (e, t2) => (_visibilitymap_prepare_truncate = Module._visibilitymap_prepare_truncate = wasmExports.visibilitymap_prepare_truncate)(e, t2), _pg_class_aclcheck = Module._pg_class_aclcheck = (e, t2, r) => (_pg_class_aclcheck = Module._pg_class_aclcheck = wasmExports.pg_class_aclcheck)(e, t2, r), _btboolcmp = Module._btboolcmp = (e) => (_btboolcmp = Module._btboolcmp = wasmExports.btboolcmp)(e), _btint2cmp = Module._btint2cmp = (e) => (_btint2cmp = Module._btint2cmp = wasmExports.btint2cmp)(e), _btint4cmp = Module._btint4cmp = (e) => (_btint4cmp = Module._btint4cmp = wasmExports.btint4cmp)(e), _btint8cmp = Module._btint8cmp = (e) => (_btint8cmp = Module._btint8cmp = wasmExports.btint8cmp)(e), _btoidcmp = Module._btoidcmp = (e) => (_btoidcmp = Module._btoidcmp = wasmExports.btoidcmp)(e), _btcharcmp = Module._btcharcmp = (e) => (_btcharcmp = Module._btcharcmp = wasmExports.btcharcmp)(e), __bt_form_posting = Module.__bt_form_posting = (e, t2, r) => (__bt_form_posting = Module.__bt_form_posting = wasmExports._bt_form_posting)(e, t2, r), __bt_mkscankey = Module.__bt_mkscankey = (e, t2) => (__bt_mkscankey = Module.__bt_mkscankey = wasmExports._bt_mkscankey)(e, t2), __bt_checkpage = Module.__bt_checkpage = (e, t2) => (__bt_checkpage = Module.__bt_checkpage = wasmExports._bt_checkpage)(e, t2), __bt_compare = Module.__bt_compare = (e, t2, r, a2) => (__bt_compare = Module.__bt_compare = wasmExports._bt_compare)(e, t2, r, a2), __bt_relbuf = Module.__bt_relbuf = (e, t2) => (__bt_relbuf = Module.__bt_relbuf = wasmExports._bt_relbuf)(e, t2), __bt_search = Module.__bt_search = (e, t2, r, a2, o4) => (__bt_search = Module.__bt_search = wasmExports._bt_search)(e, t2, r, a2, o4), __bt_binsrch_insert = Module.__bt_binsrch_insert = (e, t2) => (__bt_binsrch_insert = Module.__bt_binsrch_insert = wasmExports._bt_binsrch_insert)(e, t2), __bt_freestack = Module.__bt_freestack = (e) => (__bt_freestack = Module.__bt_freestack = wasmExports._bt_freestack)(e), __bt_metaversion = Module.__bt_metaversion = (e, t2, r) => (__bt_metaversion = Module.__bt_metaversion = wasmExports._bt_metaversion)(e, t2, r), __bt_allequalimage = Module.__bt_allequalimage = (e, t2) => (__bt_allequalimage = Module.__bt_allequalimage = wasmExports._bt_allequalimage)(e, t2), _before_shmem_exit = Module._before_shmem_exit = (e, t2) => (_before_shmem_exit = Module._before_shmem_exit = wasmExports.before_shmem_exit)(e, t2), _cancel_before_shmem_exit = Module._cancel_before_shmem_exit = (e, t2) => (_cancel_before_shmem_exit = Module._cancel_before_shmem_exit = wasmExports.cancel_before_shmem_exit)(e, t2), _pg_re_throw = Module._pg_re_throw = () => (_pg_re_throw = Module._pg_re_throw = wasmExports.pg_re_throw)(), _get_opfamily_member = Module._get_opfamily_member = (e, t2, r, a2) => (_get_opfamily_member = Module._get_opfamily_member = wasmExports.get_opfamily_member)(e, t2, r, a2), __bt_check_natts = Module.__bt_check_natts = (e, t2, r, a2) => (__bt_check_natts = Module.__bt_check_natts = wasmExports._bt_check_natts)(e, t2, r, a2), _strncpy = Module._strncpy = (e, t2, r) => (_strncpy = Module._strncpy = wasmExports.strncpy)(e, t2, r), _timestamptz_to_str = Module._timestamptz_to_str = (e) => (_timestamptz_to_str = Module._timestamptz_to_str = wasmExports.timestamptz_to_str)(e), _XLogRecGetBlockRefInfo = Module._XLogRecGetBlockRefInfo = (e, t2, r, a2, o4) => (_XLogRecGetBlockRefInfo = Module._XLogRecGetBlockRefInfo = wasmExports.XLogRecGetBlockRefInfo)(e, t2, r, a2, o4), _varstr_cmp = Module._varstr_cmp = (e, t2, r, a2, o4) => (_varstr_cmp = Module._varstr_cmp = wasmExports.varstr_cmp)(e, t2, r, a2, o4), _exprType = Module._exprType = (e) => (_exprType = Module._exprType = wasmExports.exprType)(e), _GetActiveSnapshot = Module._GetActiveSnapshot = () => (_GetActiveSnapshot = Module._GetActiveSnapshot = wasmExports.GetActiveSnapshot)(), _errdetail_relkind_not_supported = Module._errdetail_relkind_not_supported = (e) => (_errdetail_relkind_not_supported = Module._errdetail_relkind_not_supported = wasmExports.errdetail_relkind_not_supported)(e), _table_openrv = Module._table_openrv = (e, t2) => (_table_openrv = Module._table_openrv = wasmExports.table_openrv)(e, t2), _table_slot_callbacks = Module._table_slot_callbacks = (e) => (_table_slot_callbacks = Module._table_slot_callbacks = wasmExports.table_slot_callbacks)(e), _clamp_row_est = Module._clamp_row_est = (e) => (_clamp_row_est = Module._clamp_row_est = wasmExports.clamp_row_est)(e), _estimate_expression_value = Module._estimate_expression_value = (e, t2) => (_estimate_expression_value = Module._estimate_expression_value = wasmExports.estimate_expression_value)(e, t2), _XLogFlush = Module._XLogFlush = (e) => (_XLogFlush = Module._XLogFlush = wasmExports.XLogFlush)(e), _get_call_result_type = Module._get_call_result_type = (e, t2, r) => (_get_call_result_type = Module._get_call_result_type = wasmExports.get_call_result_type)(e, t2, r), _HeapTupleHeaderGetDatum = Module._HeapTupleHeaderGetDatum = (e) => (_HeapTupleHeaderGetDatum = Module._HeapTupleHeaderGetDatum = wasmExports.HeapTupleHeaderGetDatum)(e), _GenericXLogStart = Module._GenericXLogStart = (e) => (_GenericXLogStart = Module._GenericXLogStart = wasmExports.GenericXLogStart)(e), _GenericXLogRegisterBuffer = Module._GenericXLogRegisterBuffer = (e, t2, r) => (_GenericXLogRegisterBuffer = Module._GenericXLogRegisterBuffer = wasmExports.GenericXLogRegisterBuffer)(e, t2, r), _GenericXLogFinish = Module._GenericXLogFinish = (e) => (_GenericXLogFinish = Module._GenericXLogFinish = wasmExports.GenericXLogFinish)(e), _GenericXLogAbort = Module._GenericXLogAbort = (e) => (_GenericXLogAbort = Module._GenericXLogAbort = wasmExports.GenericXLogAbort)(e), _errmsg_plural = Module._errmsg_plural = (e, t2, r, a2) => (_errmsg_plural = Module._errmsg_plural = wasmExports.errmsg_plural)(e, t2, r, a2), _ReadNextMultiXactId = Module._ReadNextMultiXactId = () => (_ReadNextMultiXactId = Module._ReadNextMultiXactId = wasmExports.ReadNextMultiXactId)(), _ReadMultiXactIdRange = Module._ReadMultiXactIdRange = (e, t2) => (_ReadMultiXactIdRange = Module._ReadMultiXactIdRange = wasmExports.ReadMultiXactIdRange)(e, t2), _MultiXactIdPrecedesOrEquals = Module._MultiXactIdPrecedesOrEquals = (e, t2) => (_MultiXactIdPrecedesOrEquals = Module._MultiXactIdPrecedesOrEquals = wasmExports.MultiXactIdPrecedesOrEquals)(e, t2), _init_MultiFuncCall = Module._init_MultiFuncCall = (e) => (_init_MultiFuncCall = Module._init_MultiFuncCall = wasmExports.init_MultiFuncCall)(e), _TupleDescGetAttInMetadata = Module._TupleDescGetAttInMetadata = (e) => (_TupleDescGetAttInMetadata = Module._TupleDescGetAttInMetadata = wasmExports.TupleDescGetAttInMetadata)(e), _per_MultiFuncCall = Module._per_MultiFuncCall = (e) => (_per_MultiFuncCall = Module._per_MultiFuncCall = wasmExports.per_MultiFuncCall)(e), _BuildTupleFromCStrings = Module._BuildTupleFromCStrings = (e, t2) => (_BuildTupleFromCStrings = Module._BuildTupleFromCStrings = wasmExports.BuildTupleFromCStrings)(e, t2), _end_MultiFuncCall = Module._end_MultiFuncCall = (e, t2) => (_end_MultiFuncCall = Module._end_MultiFuncCall = wasmExports.end_MultiFuncCall)(e, t2), _GetCurrentSubTransactionId = Module._GetCurrentSubTransactionId = () => (_GetCurrentSubTransactionId = Module._GetCurrentSubTransactionId = wasmExports.GetCurrentSubTransactionId)(), _WaitForBackgroundWorkerShutdown = Module._WaitForBackgroundWorkerShutdown = (e) => (_WaitForBackgroundWorkerShutdown = Module._WaitForBackgroundWorkerShutdown = wasmExports.WaitForBackgroundWorkerShutdown)(e), _RegisterDynamicBackgroundWorker = Module._RegisterDynamicBackgroundWorker = (e, t2) => (_RegisterDynamicBackgroundWorker = Module._RegisterDynamicBackgroundWorker = wasmExports.RegisterDynamicBackgroundWorker)(e, t2), _BackgroundWorkerUnblockSignals = Module._BackgroundWorkerUnblockSignals = () => (_BackgroundWorkerUnblockSignals = Module._BackgroundWorkerUnblockSignals = wasmExports.BackgroundWorkerUnblockSignals)(), _BackgroundWorkerInitializeConnectionByOid = Module._BackgroundWorkerInitializeConnectionByOid = (e, t2, r) => (_BackgroundWorkerInitializeConnectionByOid = Module._BackgroundWorkerInitializeConnectionByOid = wasmExports.BackgroundWorkerInitializeConnectionByOid)(e, t2, r), _GetDatabaseEncoding = Module._GetDatabaseEncoding = () => (_GetDatabaseEncoding = Module._GetDatabaseEncoding = wasmExports.GetDatabaseEncoding)(), _RmgrNotFound = Module._RmgrNotFound = (e) => (_RmgrNotFound = Module._RmgrNotFound = wasmExports.RmgrNotFound)(e), _InitMaterializedSRF = Module._InitMaterializedSRF = (e, t2) => (_InitMaterializedSRF = Module._InitMaterializedSRF = wasmExports.InitMaterializedSRF)(e, t2), _tuplestore_putvalues = Module._tuplestore_putvalues = (e, t2, r, a2) => (_tuplestore_putvalues = Module._tuplestore_putvalues = wasmExports.tuplestore_putvalues)(e, t2, r, a2), _lseek = Module._lseek = (e, t2, r) => (_lseek = Module._lseek = wasmExports.lseek)(e, t2, r), _AllocateFile = Module._AllocateFile = (e, t2) => (_AllocateFile = Module._AllocateFile = wasmExports.AllocateFile)(e, t2), _FreeFile = Module._FreeFile = (e) => (_FreeFile = Module._FreeFile = wasmExports.FreeFile)(e), _fd_durable_rename = Module._fd_durable_rename = (e, t2, r) => (_fd_durable_rename = Module._fd_durable_rename = wasmExports.fd_durable_rename)(e, t2, r), _BlessTupleDesc = Module._BlessTupleDesc = (e) => (_BlessTupleDesc = Module._BlessTupleDesc = wasmExports.BlessTupleDesc)(e), _fstat = Module._fstat = (e, t2) => (_fstat = Module._fstat = wasmExports.fstat)(e, t2), _superuser_arg = Module._superuser_arg = (e) => (_superuser_arg = Module._superuser_arg = wasmExports.superuser_arg)(e), _wal_segment_close = Module._wal_segment_close = (e) => (_wal_segment_close = Module._wal_segment_close = wasmExports.wal_segment_close)(e), _wal_segment_open = Module._wal_segment_open = (e, t2, r) => (_wal_segment_open = Module._wal_segment_open = wasmExports.wal_segment_open)(e, t2, r), _XLogReaderAllocate = Module._XLogReaderAllocate = (e, t2, r, a2) => (_XLogReaderAllocate = Module._XLogReaderAllocate = wasmExports.XLogReaderAllocate)(e, t2, r, a2), _XLogReadRecord = Module._XLogReadRecord = (e, t2) => (_XLogReadRecord = Module._XLogReadRecord = wasmExports.XLogReadRecord)(e, t2), _XLogReaderFree = Module._XLogReaderFree = (e) => (_XLogReaderFree = Module._XLogReaderFree = wasmExports.XLogReaderFree)(e), _GetTopFullTransactionId = Module._GetTopFullTransactionId = () => (_GetTopFullTransactionId = Module._GetTopFullTransactionId = wasmExports.GetTopFullTransactionId)(), _GetCurrentTransactionNestLevel = Module._GetCurrentTransactionNestLevel = () => (_GetCurrentTransactionNestLevel = Module._GetCurrentTransactionNestLevel = wasmExports.GetCurrentTransactionNestLevel)(), _ResourceOwnerCreate = Module._ResourceOwnerCreate = (e, t2) => (_ResourceOwnerCreate = Module._ResourceOwnerCreate = wasmExports.ResourceOwnerCreate)(e, t2), _RegisterXactCallback = Module._RegisterXactCallback = (e, t2) => (_RegisterXactCallback = Module._RegisterXactCallback = wasmExports.RegisterXactCallback)(e, t2), _RegisterSubXactCallback = Module._RegisterSubXactCallback = (e, t2) => (_RegisterSubXactCallback = Module._RegisterSubXactCallback = wasmExports.RegisterSubXactCallback)(e, t2), _BeginInternalSubTransaction = Module._BeginInternalSubTransaction = (e) => (_BeginInternalSubTransaction = Module._BeginInternalSubTransaction = wasmExports.BeginInternalSubTransaction)(e), _ReleaseCurrentSubTransaction = Module._ReleaseCurrentSubTransaction = () => (_ReleaseCurrentSubTransaction = Module._ReleaseCurrentSubTransaction = wasmExports.ReleaseCurrentSubTransaction)(), _ResourceOwnerDelete = Module._ResourceOwnerDelete = (e) => (_ResourceOwnerDelete = Module._ResourceOwnerDelete = wasmExports.ResourceOwnerDelete)(e), _RollbackAndReleaseCurrentSubTransaction = Module._RollbackAndReleaseCurrentSubTransaction = () => (_RollbackAndReleaseCurrentSubTransaction = Module._RollbackAndReleaseCurrentSubTransaction = wasmExports.RollbackAndReleaseCurrentSubTransaction)(), _ReleaseExternalFD = Module._ReleaseExternalFD = () => (_ReleaseExternalFD = Module._ReleaseExternalFD = wasmExports.ReleaseExternalFD)(), _GetFlushRecPtr = Module._GetFlushRecPtr = (e) => (_GetFlushRecPtr = Module._GetFlushRecPtr = wasmExports.GetFlushRecPtr)(e), _GetXLogReplayRecPtr = Module._GetXLogReplayRecPtr = (e) => (_GetXLogReplayRecPtr = Module._GetXLogReplayRecPtr = wasmExports.GetXLogReplayRecPtr)(e), _TimestampDifferenceMilliseconds = Module._TimestampDifferenceMilliseconds = (e, t2) => (_TimestampDifferenceMilliseconds = Module._TimestampDifferenceMilliseconds = wasmExports.TimestampDifferenceMilliseconds)(e, t2), _numeric_in = Module._numeric_in = (e) => (_numeric_in = Module._numeric_in = wasmExports.numeric_in)(e), _DirectFunctionCall3Coll = Module._DirectFunctionCall3Coll = (e, t2, r, a2, o4) => (_DirectFunctionCall3Coll = Module._DirectFunctionCall3Coll = wasmExports.DirectFunctionCall3Coll)(e, t2, r, a2, o4), _XLogFindNextRecord = Module._XLogFindNextRecord = (e, t2) => (_XLogFindNextRecord = Module._XLogFindNextRecord = wasmExports.XLogFindNextRecord)(e, t2), _RestoreBlockImage = Module._RestoreBlockImage = (e, t2, r) => (_RestoreBlockImage = Module._RestoreBlockImage = wasmExports.RestoreBlockImage)(e, t2, r), _timestamptz_in = Module._timestamptz_in = (e) => (_timestamptz_in = Module._timestamptz_in = wasmExports.timestamptz_in)(e), _fscanf = Module._fscanf = (e, t2, r) => (_fscanf = Module._fscanf = wasmExports.fscanf)(e, t2, r), _XLogRecStoreStats = Module._XLogRecStoreStats = (e, t2) => (_XLogRecStoreStats = Module._XLogRecStoreStats = wasmExports.XLogRecStoreStats)(e, t2), _hash_get_num_entries = Module._hash_get_num_entries = (e) => (_hash_get_num_entries = Module._hash_get_num_entries = wasmExports.hash_get_num_entries)(e), _read_local_xlog_page_no_wait = Module._read_local_xlog_page_no_wait = (e, t2, r, a2, o4) => (_read_local_xlog_page_no_wait = Module._read_local_xlog_page_no_wait = wasmExports.read_local_xlog_page_no_wait)(e, t2, r, a2, o4), _escape_json = Module._escape_json = (e, t2) => (_escape_json = Module._escape_json = wasmExports.escape_json)(e, t2), _list_sort = Module._list_sort = (e, t2) => (_list_sort = Module._list_sort = wasmExports.list_sort)(e, t2), _getegid = Module._getegid = () => (_getegid = Module._getegid = wasmExports.getegid)(), _pg_checksum_page = Module._pg_checksum_page = (e, t2) => (_pg_checksum_page = Module._pg_checksum_page = wasmExports.pg_checksum_page)(e, t2), _bbsink_forward_end_archive = Module._bbsink_forward_end_archive = (e) => (_bbsink_forward_end_archive = Module._bbsink_forward_end_archive = wasmExports.bbsink_forward_end_archive)(e), _bbsink_forward_begin_manifest = Module._bbsink_forward_begin_manifest = (e) => (_bbsink_forward_begin_manifest = Module._bbsink_forward_begin_manifest = wasmExports.bbsink_forward_begin_manifest)(e), _bbsink_forward_end_manifest = Module._bbsink_forward_end_manifest = (e) => (_bbsink_forward_end_manifest = Module._bbsink_forward_end_manifest = wasmExports.bbsink_forward_end_manifest)(e), _bbsink_forward_end_backup = Module._bbsink_forward_end_backup = (e, t2, r) => (_bbsink_forward_end_backup = Module._bbsink_forward_end_backup = wasmExports.bbsink_forward_end_backup)(e, t2, r), _bbsink_forward_cleanup = Module._bbsink_forward_cleanup = (e) => (_bbsink_forward_cleanup = Module._bbsink_forward_cleanup = wasmExports.bbsink_forward_cleanup)(e), _list_concat = Module._list_concat = (e, t2) => (_list_concat = Module._list_concat = wasmExports.list_concat)(e, t2), _bbsink_forward_begin_backup = Module._bbsink_forward_begin_backup = (e) => (_bbsink_forward_begin_backup = Module._bbsink_forward_begin_backup = wasmExports.bbsink_forward_begin_backup)(e), _bbsink_forward_archive_contents = Module._bbsink_forward_archive_contents = (e, t2) => (_bbsink_forward_archive_contents = Module._bbsink_forward_archive_contents = wasmExports.bbsink_forward_archive_contents)(e, t2), _bbsink_forward_begin_archive = Module._bbsink_forward_begin_archive = (e, t2) => (_bbsink_forward_begin_archive = Module._bbsink_forward_begin_archive = wasmExports.bbsink_forward_begin_archive)(e, t2), _bbsink_forward_manifest_contents = Module._bbsink_forward_manifest_contents = (e, t2) => (_bbsink_forward_manifest_contents = Module._bbsink_forward_manifest_contents = wasmExports.bbsink_forward_manifest_contents)(e, t2), _has_privs_of_role = Module._has_privs_of_role = (e, t2) => (_has_privs_of_role = Module._has_privs_of_role = wasmExports.has_privs_of_role)(e, t2), _BaseBackupAddTarget = Module._BaseBackupAddTarget = (e, t2, r) => (_BaseBackupAddTarget = Module._BaseBackupAddTarget = wasmExports.BaseBackupAddTarget)(e, t2, r), _list_copy = Module._list_copy = (e) => (_list_copy = Module._list_copy = wasmExports.list_copy)(e), _tuplestore_puttuple = Module._tuplestore_puttuple = (e, t2) => (_tuplestore_puttuple = Module._tuplestore_puttuple = wasmExports.tuplestore_puttuple)(e, t2), _makeRangeVar = Module._makeRangeVar = (e, t2, r) => (_makeRangeVar = Module._makeRangeVar = wasmExports.makeRangeVar)(e, t2, r), _DefineIndex = Module._DefineIndex = (e, t2, r, a2, o4, s4, l3, _3, n3, m5, p4, d3) => (_DefineIndex = Module._DefineIndex = wasmExports.DefineIndex)(e, t2, r, a2, o4, s4, l3, _3, n3, m5, p4, d3), _fread = Module._fread = (e, t2, r, a2) => (_fread = Module._fread = wasmExports.fread)(e, t2, r, a2), _clearerr = Module._clearerr = (e) => (_clearerr = Module._clearerr = wasmExports.clearerr)(e), _copyObjectImpl = Module._copyObjectImpl = (e) => (_copyObjectImpl = Module._copyObjectImpl = wasmExports.copyObjectImpl)(e), _lappend_oid = Module._lappend_oid = (e, t2) => (_lappend_oid = Module._lappend_oid = wasmExports.lappend_oid)(e, t2), _makeTypeNameFromNameList = Module._makeTypeNameFromNameList = (e) => (_makeTypeNameFromNameList = Module._makeTypeNameFromNameList = wasmExports.makeTypeNameFromNameList)(e), _SearchSysCache2 = Module._SearchSysCache2 = (e, t2, r) => (_SearchSysCache2 = Module._SearchSysCache2 = wasmExports.SearchSysCache2)(e, t2, r), _SysCacheGetAttr = Module._SysCacheGetAttr = (e, t2, r, a2) => (_SysCacheGetAttr = Module._SysCacheGetAttr = wasmExports.SysCacheGetAttr)(e, t2, r, a2), _CatalogTupleUpdate = Module._CatalogTupleUpdate = (e, t2, r) => (_CatalogTupleUpdate = Module._CatalogTupleUpdate = wasmExports.CatalogTupleUpdate)(e, t2, r), _get_rel_name = Module._get_rel_name = (e) => (_get_rel_name = Module._get_rel_name = wasmExports.get_rel_name)(e), _CatalogTupleDelete = Module._CatalogTupleDelete = (e, t2) => (_CatalogTupleDelete = Module._CatalogTupleDelete = wasmExports.CatalogTupleDelete)(e, t2), _CatalogTupleInsert = Module._CatalogTupleInsert = (e, t2) => (_CatalogTupleInsert = Module._CatalogTupleInsert = wasmExports.CatalogTupleInsert)(e, t2), _recordDependencyOn = Module._recordDependencyOn = (e, t2, r) => (_recordDependencyOn = Module._recordDependencyOn = wasmExports.recordDependencyOn)(e, t2, r), _get_element_type = Module._get_element_type = (e) => (_get_element_type = Module._get_element_type = wasmExports.get_element_type)(e), _object_aclcheck = Module._object_aclcheck = (e, t2, r, a2) => (_object_aclcheck = Module._object_aclcheck = wasmExports.object_aclcheck)(e, t2, r, a2), _superuser = Module._superuser = () => (_superuser = Module._superuser = wasmExports.superuser)(), _SearchSysCacheAttName = Module._SearchSysCacheAttName = (e, t2) => (_SearchSysCacheAttName = Module._SearchSysCacheAttName = wasmExports.SearchSysCacheAttName)(e, t2), _new_object_addresses = Module._new_object_addresses = () => (_new_object_addresses = Module._new_object_addresses = wasmExports.new_object_addresses)(), _free_object_addresses = Module._free_object_addresses = (e) => (_free_object_addresses = Module._free_object_addresses = wasmExports.free_object_addresses)(e), _performMultipleDeletions = Module._performMultipleDeletions = (e, t2, r) => (_performMultipleDeletions = Module._performMultipleDeletions = wasmExports.performMultipleDeletions)(e, t2, r), _recordDependencyOnExpr = Module._recordDependencyOnExpr = (e, t2, r, a2) => (_recordDependencyOnExpr = Module._recordDependencyOnExpr = wasmExports.recordDependencyOnExpr)(e, t2, r, a2), _query_tree_walker_impl = Module._query_tree_walker_impl = (e, t2, r, a2) => (_query_tree_walker_impl = Module._query_tree_walker_impl = wasmExports.query_tree_walker_impl)(e, t2, r, a2), _expression_tree_walker_impl = Module._expression_tree_walker_impl = (e, t2, r) => (_expression_tree_walker_impl = Module._expression_tree_walker_impl = wasmExports.expression_tree_walker_impl)(e, t2, r), _add_exact_object_address = Module._add_exact_object_address = (e, t2) => (_add_exact_object_address = Module._add_exact_object_address = wasmExports.add_exact_object_address)(e, t2), _get_rel_relkind = Module._get_rel_relkind = (e) => (_get_rel_relkind = Module._get_rel_relkind = wasmExports.get_rel_relkind)(e), _get_typtype = Module._get_typtype = (e) => (_get_typtype = Module._get_typtype = wasmExports.get_typtype)(e), _list_delete_last = Module._list_delete_last = (e) => (_list_delete_last = Module._list_delete_last = wasmExports.list_delete_last)(e), _type_is_collatable = Module._type_is_collatable = (e) => (_type_is_collatable = Module._type_is_collatable = wasmExports.type_is_collatable)(e), _GetSysCacheOid = Module._GetSysCacheOid = (e, t2, r, a2, o4, s4) => (_GetSysCacheOid = Module._GetSysCacheOid = wasmExports.GetSysCacheOid)(e, t2, r, a2, o4, s4), _CheckTableNotInUse = Module._CheckTableNotInUse = (e, t2) => (_CheckTableNotInUse = Module._CheckTableNotInUse = wasmExports.CheckTableNotInUse)(e, t2), _construct_array = Module._construct_array = (e, t2, r, a2, o4, s4) => (_construct_array = Module._construct_array = wasmExports.construct_array)(e, t2, r, a2, o4, s4), _make_parsestate = Module._make_parsestate = (e) => (_make_parsestate = Module._make_parsestate = wasmExports.make_parsestate)(e), _transformExpr = Module._transformExpr = (e, t2, r) => (_transformExpr = Module._transformExpr = wasmExports.transformExpr)(e, t2, r), _equal = Module._equal = (e, t2) => (_equal = Module._equal = wasmExports.equal)(e, t2), _pull_var_clause = Module._pull_var_clause = (e, t2) => (_pull_var_clause = Module._pull_var_clause = wasmExports.pull_var_clause)(e, t2), _get_attname = Module._get_attname = (e, t2, r) => (_get_attname = Module._get_attname = wasmExports.get_attname)(e, t2, r), _coerce_to_target_type = Module._coerce_to_target_type = (e, t2, r, a2, o4, s4, l3, _3) => (_coerce_to_target_type = Module._coerce_to_target_type = wasmExports.coerce_to_target_type)(e, t2, r, a2, o4, s4, l3, _3), _nodeToString = Module._nodeToString = (e) => (_nodeToString = Module._nodeToString = wasmExports.nodeToString)(e), _parser_errposition = Module._parser_errposition = (e, t2) => (_parser_errposition = Module._parser_errposition = wasmExports.parser_errposition)(e, t2), _exprTypmod = Module._exprTypmod = (e) => (_exprTypmod = Module._exprTypmod = wasmExports.exprTypmod)(e), _get_base_element_type = Module._get_base_element_type = (e) => (_get_base_element_type = Module._get_base_element_type = wasmExports.get_base_element_type)(e), _SystemFuncName = Module._SystemFuncName = (e) => (_SystemFuncName = Module._SystemFuncName = wasmExports.SystemFuncName)(e), _CreateTrigger = Module._CreateTrigger = (e, t2, r, a2, o4, s4, l3, _3, n3, m5, p4, d3) => (_CreateTrigger = Module._CreateTrigger = wasmExports.CreateTrigger)(e, t2, r, a2, o4, s4, l3, _3, n3, m5, p4, d3), _plan_create_index_workers = Module._plan_create_index_workers = (e, t2) => (_plan_create_index_workers = Module._plan_create_index_workers = wasmExports.plan_create_index_workers)(e, t2), _get_rel_relispartition = Module._get_rel_relispartition = (e) => (_get_rel_relispartition = Module._get_rel_relispartition = wasmExports.get_rel_relispartition)(e), _get_partition_ancestors = Module._get_partition_ancestors = (e) => (_get_partition_ancestors = Module._get_partition_ancestors = wasmExports.get_partition_ancestors)(e), _get_rel_namespace = Module._get_rel_namespace = (e) => (_get_rel_namespace = Module._get_rel_namespace = wasmExports.get_rel_namespace)(e), _ConditionalLockRelationOid = Module._ConditionalLockRelationOid = (e, t2) => (_ConditionalLockRelationOid = Module._ConditionalLockRelationOid = wasmExports.ConditionalLockRelationOid)(e, t2), _RelnameGetRelid = Module._RelnameGetRelid = (e) => (_RelnameGetRelid = Module._RelnameGetRelid = wasmExports.RelnameGetRelid)(e), _get_relkind_objtype = Module._get_relkind_objtype = (e) => (_get_relkind_objtype = Module._get_relkind_objtype = wasmExports.get_relkind_objtype)(e), _RelationIsVisible = Module._RelationIsVisible = (e) => (_RelationIsVisible = Module._RelationIsVisible = wasmExports.RelationIsVisible)(e), _get_func_arg_info = Module._get_func_arg_info = (e, t2, r, a2) => (_get_func_arg_info = Module._get_func_arg_info = wasmExports.get_func_arg_info)(e, t2, r, a2), _NameListToString = Module._NameListToString = (e) => (_NameListToString = Module._NameListToString = wasmExports.NameListToString)(e), _OpernameGetOprid = Module._OpernameGetOprid = (e, t2, r) => (_OpernameGetOprid = Module._OpernameGetOprid = wasmExports.OpernameGetOprid)(e, t2, r), _makeRangeVarFromNameList = Module._makeRangeVarFromNameList = (e) => (_makeRangeVarFromNameList = Module._makeRangeVarFromNameList = wasmExports.makeRangeVarFromNameList)(e), _quote_identifier = Module._quote_identifier = (e) => (_quote_identifier = Module._quote_identifier = wasmExports.quote_identifier)(e), _GetSearchPathMatcher = Module._GetSearchPathMatcher = (e) => (_GetSearchPathMatcher = Module._GetSearchPathMatcher = wasmExports.GetSearchPathMatcher)(e), _SearchPathMatchesCurrentEnvironment = Module._SearchPathMatchesCurrentEnvironment = (e) => (_SearchPathMatchesCurrentEnvironment = Module._SearchPathMatchesCurrentEnvironment = wasmExports.SearchPathMatchesCurrentEnvironment)(e), _get_collation_oid = Module._get_collation_oid = (e, t2) => (_get_collation_oid = Module._get_collation_oid = wasmExports.get_collation_oid)(e, t2), _CacheRegisterSyscacheCallback = Module._CacheRegisterSyscacheCallback = (e, t2, r) => (_CacheRegisterSyscacheCallback = Module._CacheRegisterSyscacheCallback = wasmExports.CacheRegisterSyscacheCallback)(e, t2, r), _get_extension_oid = Module._get_extension_oid = (e, t2) => (_get_extension_oid = Module._get_extension_oid = wasmExports.get_extension_oid)(e, t2), _get_role_oid = Module._get_role_oid = (e, t2) => (_get_role_oid = Module._get_role_oid = wasmExports.get_role_oid)(e, t2), _GetForeignServerByName = Module._GetForeignServerByName = (e, t2) => (_GetForeignServerByName = Module._GetForeignServerByName = wasmExports.GetForeignServerByName)(e, t2), _GetPublicationByName = Module._GetPublicationByName = (e, t2) => (_GetPublicationByName = Module._GetPublicationByName = wasmExports.GetPublicationByName)(e, t2), _typeStringToTypeName = Module._typeStringToTypeName = (e, t2) => (_typeStringToTypeName = Module._typeStringToTypeName = wasmExports.typeStringToTypeName)(e, t2), _list_make2_impl = Module._list_make2_impl = (e, t2, r) => (_list_make2_impl = Module._list_make2_impl = wasmExports.list_make2_impl)(e, t2, r), _GetUserNameFromId = Module._GetUserNameFromId = (e, t2) => (_GetUserNameFromId = Module._GetUserNameFromId = wasmExports.GetUserNameFromId)(e, t2), _format_type_extended = Module._format_type_extended = (e, t2, r) => (_format_type_extended = Module._format_type_extended = wasmExports.format_type_extended)(e, t2, r), _quote_qualified_identifier = Module._quote_qualified_identifier = (e, t2) => (_quote_qualified_identifier = Module._quote_qualified_identifier = wasmExports.quote_qualified_identifier)(e, t2), _get_tablespace_name = Module._get_tablespace_name = (e) => (_get_tablespace_name = Module._get_tablespace_name = wasmExports.get_tablespace_name)(e), _GetForeignServerExtended = Module._GetForeignServerExtended = (e, t2) => (_GetForeignServerExtended = Module._GetForeignServerExtended = wasmExports.GetForeignServerExtended)(e, t2), _GetForeignServer = Module._GetForeignServer = (e) => (_GetForeignServer = Module._GetForeignServer = wasmExports.GetForeignServer)(e), _construct_empty_array = Module._construct_empty_array = (e) => (_construct_empty_array = Module._construct_empty_array = wasmExports.construct_empty_array)(e), _format_type_be_qualified = Module._format_type_be_qualified = (e) => (_format_type_be_qualified = Module._format_type_be_qualified = wasmExports.format_type_be_qualified)(e), _get_namespace_name_or_temp = Module._get_namespace_name_or_temp = (e) => (_get_namespace_name_or_temp = Module._get_namespace_name_or_temp = wasmExports.get_namespace_name_or_temp)(e), _list_make3_impl = Module._list_make3_impl = (e, t2, r, a2) => (_list_make3_impl = Module._list_make3_impl = wasmExports.list_make3_impl)(e, t2, r, a2), _construct_md_array = Module._construct_md_array = (e, t2, r, a2, o4, s4, l3, _3, n3) => (_construct_md_array = Module._construct_md_array = wasmExports.construct_md_array)(e, t2, r, a2, o4, s4, l3, _3, n3), _pull_varattnos = Module._pull_varattnos = (e, t2, r) => (_pull_varattnos = Module._pull_varattnos = wasmExports.pull_varattnos)(e, t2, r), _get_func_name = Module._get_func_name = (e) => (_get_func_name = Module._get_func_name = wasmExports.get_func_name)(e), _ExecPrepareExpr = Module._ExecPrepareExpr = (e, t2) => (_ExecPrepareExpr = Module._ExecPrepareExpr = wasmExports.ExecPrepareExpr)(e, t2), _construct_array_builtin = Module._construct_array_builtin = (e, t2, r) => (_construct_array_builtin = Module._construct_array_builtin = wasmExports.construct_array_builtin)(e, t2, r), _makeObjectName = Module._makeObjectName = (e, t2, r) => (_makeObjectName = Module._makeObjectName = wasmExports.makeObjectName)(e, t2, r), _get_primary_key_attnos = Module._get_primary_key_attnos = (e, t2, r) => (_get_primary_key_attnos = Module._get_primary_key_attnos = wasmExports.get_primary_key_attnos)(e, t2, r), _bms_is_subset = Module._bms_is_subset = (e, t2) => (_bms_is_subset = Module._bms_is_subset = wasmExports.bms_is_subset)(e, t2), _getExtensionOfObject = Module._getExtensionOfObject = (e, t2) => (_getExtensionOfObject = Module._getExtensionOfObject = wasmExports.getExtensionOfObject)(e, t2), _find_inheritance_children = Module._find_inheritance_children = (e, t2) => (_find_inheritance_children = Module._find_inheritance_children = wasmExports.find_inheritance_children)(e, t2), _lappend_int = Module._lappend_int = (e, t2) => (_lappend_int = Module._lappend_int = wasmExports.lappend_int)(e, t2), _has_superclass = Module._has_superclass = (e) => (_has_superclass = Module._has_superclass = wasmExports.has_superclass)(e), _CheckFunctionValidatorAccess = Module._CheckFunctionValidatorAccess = (e, t2) => (_CheckFunctionValidatorAccess = Module._CheckFunctionValidatorAccess = wasmExports.CheckFunctionValidatorAccess)(e, t2), _AcquireRewriteLocks = Module._AcquireRewriteLocks = (e, t2, r) => (_AcquireRewriteLocks = Module._AcquireRewriteLocks = wasmExports.AcquireRewriteLocks)(e, t2, r), _function_parse_error_transpose = Module._function_parse_error_transpose = (e) => (_function_parse_error_transpose = Module._function_parse_error_transpose = wasmExports.function_parse_error_transpose)(e), _geterrposition = Module._geterrposition = () => (_geterrposition = Module._geterrposition = wasmExports.geterrposition)(), _getinternalerrposition = Module._getinternalerrposition = () => (_getinternalerrposition = Module._getinternalerrposition = wasmExports.getinternalerrposition)(), _pg_mblen = Module._pg_mblen = (e) => (_pg_mblen = Module._pg_mblen = wasmExports.pg_mblen)(e), _pg_mbstrlen_with_len = Module._pg_mbstrlen_with_len = (e, t2) => (_pg_mbstrlen_with_len = Module._pg_mbstrlen_with_len = wasmExports.pg_mbstrlen_with_len)(e, t2), _errposition = Module._errposition = (e) => (_errposition = Module._errposition = wasmExports.errposition)(e), _internalerrposition = Module._internalerrposition = (e) => (_internalerrposition = Module._internalerrposition = wasmExports.internalerrposition)(e), _internalerrquery = Module._internalerrquery = (e) => (_internalerrquery = Module._internalerrquery = wasmExports.internalerrquery)(e), _is_publishable_relation = Module._is_publishable_relation = (e) => (_is_publishable_relation = Module._is_publishable_relation = wasmExports.is_publishable_relation)(e), _GetTopMostAncestorInPublication = Module._GetTopMostAncestorInPublication = (e, t2, r) => (_GetTopMostAncestorInPublication = Module._GetTopMostAncestorInPublication = wasmExports.GetTopMostAncestorInPublication)(e, t2, r), _GetRelationPublications = Module._GetRelationPublications = (e) => (_GetRelationPublications = Module._GetRelationPublications = wasmExports.GetRelationPublications)(e), _GetSchemaPublications = Module._GetSchemaPublications = (e) => (_GetSchemaPublications = Module._GetSchemaPublications = wasmExports.GetSchemaPublications)(e), _pub_collist_to_bitmapset = Module._pub_collist_to_bitmapset = (e, t2, r) => (_pub_collist_to_bitmapset = Module._pub_collist_to_bitmapset = wasmExports.pub_collist_to_bitmapset)(e, t2, r), _list_delete_nth_cell = Module._list_delete_nth_cell = (e, t2) => (_list_delete_nth_cell = Module._list_delete_nth_cell = wasmExports.list_delete_nth_cell)(e, t2), _get_array_type = Module._get_array_type = (e) => (_get_array_type = Module._get_array_type = wasmExports.get_array_type)(e), _smgrtruncate2 = Module._smgrtruncate2 = (e, t2, r, a2, o4) => (_smgrtruncate2 = Module._smgrtruncate2 = wasmExports.smgrtruncate2)(e, t2, r, a2, o4), _smgrreadv = Module._smgrreadv = (e, t2, r, a2, o4) => (_smgrreadv = Module._smgrreadv = wasmExports.smgrreadv)(e, t2, r, a2, o4), _NewRelationCreateToastTable = Module._NewRelationCreateToastTable = (e, t2) => (_NewRelationCreateToastTable = Module._NewRelationCreateToastTable = wasmExports.NewRelationCreateToastTable)(e, t2), _transformStmt = Module._transformStmt = (e, t2) => (_transformStmt = Module._transformStmt = wasmExports.transformStmt)(e, t2), _exprLocation = Module._exprLocation = (e) => (_exprLocation = Module._exprLocation = wasmExports.exprLocation)(e), _ParseFuncOrColumn = Module._ParseFuncOrColumn = (e, t2, r, a2, o4, s4, l3) => (_ParseFuncOrColumn = Module._ParseFuncOrColumn = wasmExports.ParseFuncOrColumn)(e, t2, r, a2, o4, s4, l3), _exprCollation = Module._exprCollation = (e) => (_exprCollation = Module._exprCollation = wasmExports.exprCollation)(e), _transformDistinctClause = Module._transformDistinctClause = (e, t2, r, a2) => (_transformDistinctClause = Module._transformDistinctClause = wasmExports.transformDistinctClause)(e, t2, r, a2), _makeTargetEntry = Module._makeTargetEntry = (e, t2, r, a2) => (_makeTargetEntry = Module._makeTargetEntry = wasmExports.makeTargetEntry)(e, t2, r, a2), _makeAlias = Module._makeAlias = (e, t2) => (_makeAlias = Module._makeAlias = wasmExports.makeAlias)(e, t2), _addRangeTableEntryForSubquery = Module._addRangeTableEntryForSubquery = (e, t2, r, a2, o4) => (_addRangeTableEntryForSubquery = Module._addRangeTableEntryForSubquery = wasmExports.addRangeTableEntryForSubquery)(e, t2, r, a2, o4), _makeVar = Module._makeVar = (e, t2, r, a2, o4, s4) => (_makeVar = Module._makeVar = wasmExports.makeVar)(e, t2, r, a2, o4, s4), _makeBoolean = Module._makeBoolean = (e) => (_makeBoolean = Module._makeBoolean = wasmExports.makeBoolean)(e), _makeInteger = Module._makeInteger = (e) => (_makeInteger = Module._makeInteger = wasmExports.makeInteger)(e), _makeTypeName = Module._makeTypeName = (e) => (_makeTypeName = Module._makeTypeName = wasmExports.makeTypeName)(e), _makeFuncCall = Module._makeFuncCall = (e, t2, r, a2) => (_makeFuncCall = Module._makeFuncCall = wasmExports.makeFuncCall)(e, t2, r, a2), _list_make4_impl = Module._list_make4_impl = (e, t2, r, a2, o4) => (_list_make4_impl = Module._list_make4_impl = wasmExports.list_make4_impl)(e, t2, r, a2, o4), _get_sortgroupclause_tle = Module._get_sortgroupclause_tle = (e, t2) => (_get_sortgroupclause_tle = Module._get_sortgroupclause_tle = wasmExports.get_sortgroupclause_tle)(e, t2), _flatten_join_alias_vars = Module._flatten_join_alias_vars = (e, t2, r) => (_flatten_join_alias_vars = Module._flatten_join_alias_vars = wasmExports.flatten_join_alias_vars)(e, t2, r), _list_member_int = Module._list_member_int = (e, t2) => (_list_member_int = Module._list_member_int = wasmExports.list_member_int)(e, t2), _addRangeTableEntryForENR = Module._addRangeTableEntryForENR = (e, t2, r) => (_addRangeTableEntryForENR = Module._addRangeTableEntryForENR = wasmExports.addRangeTableEntryForENR)(e, t2, r), _typenameTypeIdAndMod = Module._typenameTypeIdAndMod = (e, t2, r, a2) => (_typenameTypeIdAndMod = Module._typenameTypeIdAndMod = wasmExports.typenameTypeIdAndMod)(e, t2, r, a2), _get_typcollation = Module._get_typcollation = (e) => (_get_typcollation = Module._get_typcollation = wasmExports.get_typcollation)(e), _strip_implicit_coercions = Module._strip_implicit_coercions = (e) => (_strip_implicit_coercions = Module._strip_implicit_coercions = wasmExports.strip_implicit_coercions)(e), _get_sortgroupref_tle = Module._get_sortgroupref_tle = (e, t2) => (_get_sortgroupref_tle = Module._get_sortgroupref_tle = wasmExports.get_sortgroupref_tle)(e, t2), _contain_aggs_of_level = Module._contain_aggs_of_level = (e, t2) => (_contain_aggs_of_level = Module._contain_aggs_of_level = wasmExports.contain_aggs_of_level)(e, t2), _typeidType = Module._typeidType = (e) => (_typeidType = Module._typeidType = wasmExports.typeidType)(e), _typeTypeCollation = Module._typeTypeCollation = (e) => (_typeTypeCollation = Module._typeTypeCollation = wasmExports.typeTypeCollation)(e), _typeLen = Module._typeLen = (e) => (_typeLen = Module._typeLen = wasmExports.typeLen)(e), _typeByVal = Module._typeByVal = (e) => (_typeByVal = Module._typeByVal = wasmExports.typeByVal)(e), _makeConst = Module._makeConst = (e, t2, r, a2, o4, s4, l3) => (_makeConst = Module._makeConst = wasmExports.makeConst)(e, t2, r, a2, o4, s4, l3), _lookup_rowtype_tupdesc = Module._lookup_rowtype_tupdesc = (e, t2) => (_lookup_rowtype_tupdesc = Module._lookup_rowtype_tupdesc = wasmExports.lookup_rowtype_tupdesc)(e, t2), _bms_del_member = Module._bms_del_member = (e, t2) => (_bms_del_member = Module._bms_del_member = wasmExports.bms_del_member)(e, t2), _list_member = Module._list_member = (e, t2) => (_list_member = Module._list_member = wasmExports.list_member)(e, t2), _type_is_rowtype = Module._type_is_rowtype = (e) => (_type_is_rowtype = Module._type_is_rowtype = wasmExports.type_is_rowtype)(e), _bit_in = Module._bit_in = (e) => (_bit_in = Module._bit_in = wasmExports.bit_in)(e), _bms_union = Module._bms_union = (e, t2) => (_bms_union = Module._bms_union = wasmExports.bms_union)(e, t2), _varstr_levenshtein_less_equal = Module._varstr_levenshtein_less_equal = (e, t2, r, a2, o4, s4, l3, _3, n3) => (_varstr_levenshtein_less_equal = Module._varstr_levenshtein_less_equal = wasmExports.varstr_levenshtein_less_equal)(e, t2, r, a2, o4, s4, l3, _3, n3), _addRTEPermissionInfo = Module._addRTEPermissionInfo = (e, t2) => (_addRTEPermissionInfo = Module._addRTEPermissionInfo = wasmExports.addRTEPermissionInfo)(e, t2), _errsave_start = Module._errsave_start = (e, t2) => (_errsave_start = Module._errsave_start = wasmExports.errsave_start)(e, t2), _errsave_finish = Module._errsave_finish = (e, t2, r, a2) => (_errsave_finish = Module._errsave_finish = wasmExports.errsave_finish)(e, t2, r, a2), _makeColumnDef = Module._makeColumnDef = (e, t2, r, a2) => (_makeColumnDef = Module._makeColumnDef = wasmExports.makeColumnDef)(e, t2, r, a2), _GetDefaultOpClass = Module._GetDefaultOpClass = (e, t2) => (_GetDefaultOpClass = Module._GetDefaultOpClass = wasmExports.GetDefaultOpClass)(e, t2), _scanner_init = Module._scanner_init = (e, t2, r, a2) => (_scanner_init = Module._scanner_init = wasmExports.scanner_init)(e, t2, r, a2), _scanner_finish = Module._scanner_finish = (e) => (_scanner_finish = Module._scanner_finish = wasmExports.scanner_finish)(e), _core_yylex = Module._core_yylex = (e, t2, r) => (_core_yylex = Module._core_yylex = wasmExports.core_yylex)(e, t2, r), _isxdigit = Module._isxdigit = (e) => (_isxdigit = Module._isxdigit = wasmExports.isxdigit)(e), _scanner_isspace = Module._scanner_isspace = (e) => (_scanner_isspace = Module._scanner_isspace = wasmExports.scanner_isspace)(e), _truncate_identifier = Module._truncate_identifier = (e, t2, r) => (_truncate_identifier = Module._truncate_identifier = wasmExports.truncate_identifier)(e, t2, r), _downcase_truncate_identifier = Module._downcase_truncate_identifier = (e, t2, r) => (_downcase_truncate_identifier = Module._downcase_truncate_identifier = wasmExports.downcase_truncate_identifier)(e, t2, r), _pg_database_encoding_max_length = Module._pg_database_encoding_max_length = () => (_pg_database_encoding_max_length = Module._pg_database_encoding_max_length = wasmExports.pg_database_encoding_max_length)(), _namein = Module._namein = (e) => (_namein = Module._namein = wasmExports.namein)(e), _BlockSampler_Init = Module._BlockSampler_Init = (e, t2, r, a2) => (_BlockSampler_Init = Module._BlockSampler_Init = wasmExports.BlockSampler_Init)(e, t2, r, a2), _reservoir_init_selection_state = Module._reservoir_init_selection_state = (e, t2) => (_reservoir_init_selection_state = Module._reservoir_init_selection_state = wasmExports.reservoir_init_selection_state)(e, t2), _reservoir_get_next_S = Module._reservoir_get_next_S = (e, t2, r) => (_reservoir_get_next_S = Module._reservoir_get_next_S = wasmExports.reservoir_get_next_S)(e, t2, r), _sampler_random_fract = Module._sampler_random_fract = (e) => (_sampler_random_fract = Module._sampler_random_fract = wasmExports.sampler_random_fract)(e), _BlockSampler_HasMore = Module._BlockSampler_HasMore = (e) => (_BlockSampler_HasMore = Module._BlockSampler_HasMore = wasmExports.BlockSampler_HasMore)(e), _BlockSampler_Next = Module._BlockSampler_Next = (e) => (_BlockSampler_Next = Module._BlockSampler_Next = wasmExports.BlockSampler_Next)(e), _Async_Notify = Module._Async_Notify = (e, t2) => (_Async_Notify = Module._Async_Notify = wasmExports.Async_Notify)(e, t2), _RangeVarCallbackMaintainsTable = Module._RangeVarCallbackMaintainsTable = (e, t2, r, a2) => (_RangeVarCallbackMaintainsTable = Module._RangeVarCallbackMaintainsTable = wasmExports.RangeVarCallbackMaintainsTable)(e, t2, r, a2), _make_new_heap = Module._make_new_heap = (e, t2, r, a2, o4) => (_make_new_heap = Module._make_new_heap = wasmExports.make_new_heap)(e, t2, r, a2, o4), _finish_heap_swap = Module._finish_heap_swap = (e, t2, r, a2, o4, s4, l3, _3, n3) => (_finish_heap_swap = Module._finish_heap_swap = wasmExports.finish_heap_swap)(e, t2, r, a2, o4, s4, l3, _3, n3), _wasm_OpenPipeStream = Module._wasm_OpenPipeStream = (e, t2) => (_wasm_OpenPipeStream = Module._wasm_OpenPipeStream = wasmExports.wasm_OpenPipeStream)(e, t2), _ClosePipeStream = Module._ClosePipeStream = (e) => (_ClosePipeStream = Module._ClosePipeStream = wasmExports.ClosePipeStream)(e), _BeginCopyFrom = Module._BeginCopyFrom = (e, t2, r, a2, o4, s4, l3, _3) => (_BeginCopyFrom = Module._BeginCopyFrom = wasmExports.BeginCopyFrom)(e, t2, r, a2, o4, s4, l3, _3), _EndCopyFrom = Module._EndCopyFrom = (e) => (_EndCopyFrom = Module._EndCopyFrom = wasmExports.EndCopyFrom)(e), _ProcessCopyOptions = Module._ProcessCopyOptions = (e, t2, r, a2) => (_ProcessCopyOptions = Module._ProcessCopyOptions = wasmExports.ProcessCopyOptions)(e, t2, r, a2), _CopyFromErrorCallback = Module._CopyFromErrorCallback = (e) => (_CopyFromErrorCallback = Module._CopyFromErrorCallback = wasmExports.CopyFromErrorCallback)(e), _ExecInitRangeTable = Module._ExecInitRangeTable = (e, t2, r) => (_ExecInitRangeTable = Module._ExecInitRangeTable = wasmExports.ExecInitRangeTable)(e, t2, r), _NextCopyFrom = Module._NextCopyFrom = (e, t2, r, a2) => (_NextCopyFrom = Module._NextCopyFrom = wasmExports.NextCopyFrom)(e, t2, r, a2), _ExecInitExpr = Module._ExecInitExpr = (e, t2) => (_ExecInitExpr = Module._ExecInitExpr = wasmExports.ExecInitExpr)(e, t2), _report_invalid_encoding = Module._report_invalid_encoding = (e, t2, r) => (_report_invalid_encoding = Module._report_invalid_encoding = wasmExports.report_invalid_encoding)(e, t2, r), _tolower = Module._tolower = (e) => (_tolower = Module._tolower = wasmExports.tolower)(e), _PushCopiedSnapshot = Module._PushCopiedSnapshot = (e) => (_PushCopiedSnapshot = Module._PushCopiedSnapshot = wasmExports.PushCopiedSnapshot)(e), _UpdateActiveSnapshotCommandId = Module._UpdateActiveSnapshotCommandId = () => (_UpdateActiveSnapshotCommandId = Module._UpdateActiveSnapshotCommandId = wasmExports.UpdateActiveSnapshotCommandId)(), _CreateQueryDesc = Module._CreateQueryDesc = (e, t2, r, a2, o4, s4, l3, _3) => (_CreateQueryDesc = Module._CreateQueryDesc = wasmExports.CreateQueryDesc)(e, t2, r, a2, o4, s4, l3, _3), _ExecutorStart = Module._ExecutorStart = (e, t2) => (_ExecutorStart = Module._ExecutorStart = wasmExports.ExecutorStart)(e, t2), _ExecutorFinish = Module._ExecutorFinish = (e) => (_ExecutorFinish = Module._ExecutorFinish = wasmExports.ExecutorFinish)(e), _ExecutorEnd = Module._ExecutorEnd = (e) => (_ExecutorEnd = Module._ExecutorEnd = wasmExports.ExecutorEnd)(e), _FreeQueryDesc = Module._FreeQueryDesc = (e) => (_FreeQueryDesc = Module._FreeQueryDesc = wasmExports.FreeQueryDesc)(e), _pg_server_to_any = Module._pg_server_to_any = (e, t2, r) => (_pg_server_to_any = Module._pg_server_to_any = wasmExports.pg_server_to_any)(e, t2, r), _ExecutorRun = Module._ExecutorRun = (e, t2, r, a2) => (_ExecutorRun = Module._ExecutorRun = wasmExports.ExecutorRun)(e, t2, r, a2), _CreateTableAsRelExists = Module._CreateTableAsRelExists = (e) => (_CreateTableAsRelExists = Module._CreateTableAsRelExists = wasmExports.CreateTableAsRelExists)(e), _DefineRelation = Module._DefineRelation = (e, t2, r, a2, o4, s4) => (_DefineRelation = Module._DefineRelation = wasmExports.DefineRelation)(e, t2, r, a2, o4, s4), _oidin = Module._oidin = (e) => (_oidin = Module._oidin = wasmExports.oidin)(e), _GetCommandTagName = Module._GetCommandTagName = (e) => (_GetCommandTagName = Module._GetCommandTagName = wasmExports.GetCommandTagName)(e), _ExplainBeginOutput = Module._ExplainBeginOutput = (e) => (_ExplainBeginOutput = Module._ExplainBeginOutput = wasmExports.ExplainBeginOutput)(e), _NewExplainState = Module._NewExplainState = () => (_NewExplainState = Module._NewExplainState = wasmExports.NewExplainState)(), _ExplainEndOutput = Module._ExplainEndOutput = (e) => (_ExplainEndOutput = Module._ExplainEndOutput = wasmExports.ExplainEndOutput)(e), _ExplainPrintPlan = Module._ExplainPrintPlan = (e, t2) => (_ExplainPrintPlan = Module._ExplainPrintPlan = wasmExports.ExplainPrintPlan)(e, t2), _ExplainPrintTriggers = Module._ExplainPrintTriggers = (e, t2) => (_ExplainPrintTriggers = Module._ExplainPrintTriggers = wasmExports.ExplainPrintTriggers)(e, t2), _ExplainPrintJITSummary = Module._ExplainPrintJITSummary = (e, t2) => (_ExplainPrintJITSummary = Module._ExplainPrintJITSummary = wasmExports.ExplainPrintJITSummary)(e, t2), _InstrEndLoop = Module._InstrEndLoop = (e) => (_InstrEndLoop = Module._InstrEndLoop = wasmExports.InstrEndLoop)(e), _ExplainPropertyInteger = Module._ExplainPropertyInteger = (e, t2, r, a2) => (_ExplainPropertyInteger = Module._ExplainPropertyInteger = wasmExports.ExplainPropertyInteger)(e, t2, r, a2), _make_orclause = Module._make_orclause = (e) => (_make_orclause = Module._make_orclause = wasmExports.make_orclause)(e), _ExplainQueryText = Module._ExplainQueryText = (e, t2) => (_ExplainQueryText = Module._ExplainQueryText = wasmExports.ExplainQueryText)(e, t2), _ExplainPropertyText = Module._ExplainPropertyText = (e, t2, r) => (_ExplainPropertyText = Module._ExplainPropertyText = wasmExports.ExplainPropertyText)(e, t2, r), _ExplainQueryParameters = Module._ExplainQueryParameters = (e, t2, r) => (_ExplainQueryParameters = Module._ExplainQueryParameters = wasmExports.ExplainQueryParameters)(e, t2, r), _get_func_namespace = Module._get_func_namespace = (e) => (_get_func_namespace = Module._get_func_namespace = wasmExports.get_func_namespace)(e), _get_rel_type_id = Module._get_rel_type_id = (e) => (_get_rel_type_id = Module._get_rel_type_id = wasmExports.get_rel_type_id)(e), _set_config_option = Module._set_config_option = (e, t2, r, a2, o4, s4, l3, _3) => (_set_config_option = Module._set_config_option = wasmExports.set_config_option)(e, t2, r, a2, o4, s4, l3, _3), _pg_any_to_server = Module._pg_any_to_server = (e, t2, r) => (_pg_any_to_server = Module._pg_any_to_server = wasmExports.pg_any_to_server)(e, t2, r), _DirectFunctionCall4Coll = Module._DirectFunctionCall4Coll = (e, t2, r, a2, o4, s4) => (_DirectFunctionCall4Coll = Module._DirectFunctionCall4Coll = wasmExports.DirectFunctionCall4Coll)(e, t2, r, a2, o4, s4), _list_delete_cell = Module._list_delete_cell = (e, t2) => (_list_delete_cell = Module._list_delete_cell = wasmExports.list_delete_cell)(e, t2), _GetForeignDataWrapper = Module._GetForeignDataWrapper = (e) => (_GetForeignDataWrapper = Module._GetForeignDataWrapper = wasmExports.GetForeignDataWrapper)(e), _CreateExprContext = Module._CreateExprContext = (e) => (_CreateExprContext = Module._CreateExprContext = wasmExports.CreateExprContext)(e), _EnsurePortalSnapshotExists = Module._EnsurePortalSnapshotExists = () => (_EnsurePortalSnapshotExists = Module._EnsurePortalSnapshotExists = wasmExports.EnsurePortalSnapshotExists)(), _CheckIndexCompatible = Module._CheckIndexCompatible = (e, t2, r, a2) => (_CheckIndexCompatible = Module._CheckIndexCompatible = wasmExports.CheckIndexCompatible)(e, t2, r, a2), _pgstat_count_truncate = Module._pgstat_count_truncate = (e) => (_pgstat_count_truncate = Module._pgstat_count_truncate = wasmExports.pgstat_count_truncate)(e), _SPI_connect = Module._SPI_connect = () => (_SPI_connect = Module._SPI_connect = wasmExports.SPI_connect)(), _SPI_exec = Module._SPI_exec = (e, t2) => (_SPI_exec = Module._SPI_exec = wasmExports.SPI_exec)(e, t2), _SPI_execute = Module._SPI_execute = (e, t2, r) => (_SPI_execute = Module._SPI_execute = wasmExports.SPI_execute)(e, t2, r), _SPI_getvalue = Module._SPI_getvalue = (e, t2, r) => (_SPI_getvalue = Module._SPI_getvalue = wasmExports.SPI_getvalue)(e, t2, r), _generate_operator_clause = Module._generate_operator_clause = (e, t2, r, a2, o4, s4) => (_generate_operator_clause = Module._generate_operator_clause = wasmExports.generate_operator_clause)(e, t2, r, a2, o4, s4), _SPI_finish = Module._SPI_finish = () => (_SPI_finish = Module._SPI_finish = wasmExports.SPI_finish)(), _CreateTransientRelDestReceiver = Module._CreateTransientRelDestReceiver = (e) => (_CreateTransientRelDestReceiver = Module._CreateTransientRelDestReceiver = wasmExports.CreateTransientRelDestReceiver)(e), _MemoryContextSetIdentifier = Module._MemoryContextSetIdentifier = (e, t2) => (_MemoryContextSetIdentifier = Module._MemoryContextSetIdentifier = wasmExports.MemoryContextSetIdentifier)(e, t2), _checkExprHasSubLink = Module._checkExprHasSubLink = (e) => (_checkExprHasSubLink = Module._checkExprHasSubLink = wasmExports.checkExprHasSubLink)(e), _SetTuplestoreDestReceiverParams = Module._SetTuplestoreDestReceiverParams = (e, t2, r, a2, o4, s4) => (_SetTuplestoreDestReceiverParams = Module._SetTuplestoreDestReceiverParams = wasmExports.SetTuplestoreDestReceiverParams)(e, t2, r, a2, o4, s4), _tuplestore_rescan = Module._tuplestore_rescan = (e) => (_tuplestore_rescan = Module._tuplestore_rescan = wasmExports.tuplestore_rescan)(e), _MemoryContextDeleteChildren = Module._MemoryContextDeleteChildren = (e) => (_MemoryContextDeleteChildren = Module._MemoryContextDeleteChildren = wasmExports.MemoryContextDeleteChildren)(e), _ReleaseCachedPlan = Module._ReleaseCachedPlan = (e, t2) => (_ReleaseCachedPlan = Module._ReleaseCachedPlan = wasmExports.ReleaseCachedPlan)(e, t2), _bms_equal = Module._bms_equal = (e, t2) => (_bms_equal = Module._bms_equal = wasmExports.bms_equal)(e, t2), _nextval = Module._nextval = (e) => (_nextval = Module._nextval = wasmExports.nextval)(e), _textToQualifiedNameList = Module._textToQualifiedNameList = (e) => (_textToQualifiedNameList = Module._textToQualifiedNameList = wasmExports.textToQualifiedNameList)(e), _defGetStreamingMode = Module._defGetStreamingMode = (e) => (_defGetStreamingMode = Module._defGetStreamingMode = wasmExports.defGetStreamingMode)(e), _pg_lsn_in = Module._pg_lsn_in = (e) => (_pg_lsn_in = Module._pg_lsn_in = wasmExports.pg_lsn_in)(e), _tuplestore_gettupleslot = Module._tuplestore_gettupleslot = (e, t2, r, a2) => (_tuplestore_gettupleslot = Module._tuplestore_gettupleslot = wasmExports.tuplestore_gettupleslot)(e, t2, r, a2), _list_delete = Module._list_delete = (e, t2) => (_list_delete = Module._list_delete = wasmExports.list_delete)(e, t2), _tuplestore_end = Module._tuplestore_end = (e) => (_tuplestore_end = Module._tuplestore_end = wasmExports.tuplestore_end)(e), _quote_literal_cstr = Module._quote_literal_cstr = (e) => (_quote_literal_cstr = Module._quote_literal_cstr = wasmExports.quote_literal_cstr)(e), _contain_mutable_functions = Module._contain_mutable_functions = (e) => (_contain_mutable_functions = Module._contain_mutable_functions = wasmExports.contain_mutable_functions)(e), _ExecuteTruncateGuts = Module._ExecuteTruncateGuts = (e, t2, r, a2, o4, s4) => (_ExecuteTruncateGuts = Module._ExecuteTruncateGuts = wasmExports.ExecuteTruncateGuts)(e, t2, r, a2, o4, s4), _bms_make_singleton = Module._bms_make_singleton = (e) => (_bms_make_singleton = Module._bms_make_singleton = wasmExports.bms_make_singleton)(e), _tuplestore_puttupleslot = Module._tuplestore_puttupleslot = (e, t2) => (_tuplestore_puttupleslot = Module._tuplestore_puttupleslot = wasmExports.tuplestore_puttupleslot)(e, t2), _tuplestore_begin_heap = Module._tuplestore_begin_heap = (e, t2, r) => (_tuplestore_begin_heap = Module._tuplestore_begin_heap = wasmExports.tuplestore_begin_heap)(e, t2, r), _ExecForceStoreHeapTuple = Module._ExecForceStoreHeapTuple = (e, t2, r) => (_ExecForceStoreHeapTuple = Module._ExecForceStoreHeapTuple = wasmExports.ExecForceStoreHeapTuple)(e, t2, r), _strtod = Module._strtod = (e, t2) => (_strtod = Module._strtod = wasmExports.strtod)(e, t2), _plain_crypt_verify = Module._plain_crypt_verify = (e, t2, r, a2) => (_plain_crypt_verify = Module._plain_crypt_verify = wasmExports.plain_crypt_verify)(e, t2, r, a2), _ProcessConfigFile = Module._ProcessConfigFile = (e) => (_ProcessConfigFile = Module._ProcessConfigFile = wasmExports.ProcessConfigFile)(e), _ExecReScan = Module._ExecReScan = (e) => (_ExecReScan = Module._ExecReScan = wasmExports.ExecReScan)(e), _ExecAsyncResponse = Module._ExecAsyncResponse = (e) => (_ExecAsyncResponse = Module._ExecAsyncResponse = wasmExports.ExecAsyncResponse)(e), _ExecAsyncRequestDone = Module._ExecAsyncRequestDone = (e, t2) => (_ExecAsyncRequestDone = Module._ExecAsyncRequestDone = wasmExports.ExecAsyncRequestDone)(e, t2), _ExecAsyncRequestPending = Module._ExecAsyncRequestPending = (e) => (_ExecAsyncRequestPending = Module._ExecAsyncRequestPending = wasmExports.ExecAsyncRequestPending)(e), _ExprEvalPushStep = Module._ExprEvalPushStep = (e, t2) => (_ExprEvalPushStep = Module._ExprEvalPushStep = wasmExports.ExprEvalPushStep)(e, t2), _ExecInitExprWithParams = Module._ExecInitExprWithParams = (e, t2) => (_ExecInitExprWithParams = Module._ExecInitExprWithParams = wasmExports.ExecInitExprWithParams)(e, t2), _ExecInitExprList = Module._ExecInitExprList = (e, t2) => (_ExecInitExprList = Module._ExecInitExprList = wasmExports.ExecInitExprList)(e, t2), _MakeExpandedObjectReadOnlyInternal = Module._MakeExpandedObjectReadOnlyInternal = (e) => (_MakeExpandedObjectReadOnlyInternal = Module._MakeExpandedObjectReadOnlyInternal = wasmExports.MakeExpandedObjectReadOnlyInternal)(e), _tuplesort_puttupleslot = Module._tuplesort_puttupleslot = (e, t2) => (_tuplesort_puttupleslot = Module._tuplesort_puttupleslot = wasmExports.tuplesort_puttupleslot)(e, t2), _ArrayGetNItems = Module._ArrayGetNItems = (e, t2) => (_ArrayGetNItems = Module._ArrayGetNItems = wasmExports.ArrayGetNItems)(e, t2), _expanded_record_fetch_tupdesc = Module._expanded_record_fetch_tupdesc = (e) => (_expanded_record_fetch_tupdesc = Module._expanded_record_fetch_tupdesc = wasmExports.expanded_record_fetch_tupdesc)(e), _expanded_record_fetch_field = Module._expanded_record_fetch_field = (e, t2, r) => (_expanded_record_fetch_field = Module._expanded_record_fetch_field = wasmExports.expanded_record_fetch_field)(e, t2, r), _JsonbValueToJsonb = Module._JsonbValueToJsonb = (e) => (_JsonbValueToJsonb = Module._JsonbValueToJsonb = wasmExports.JsonbValueToJsonb)(e), _boolout = Module._boolout = (e) => (_boolout = Module._boolout = wasmExports.boolout)(e), _lookup_rowtype_tupdesc_domain = Module._lookup_rowtype_tupdesc_domain = (e, t2, r) => (_lookup_rowtype_tupdesc_domain = Module._lookup_rowtype_tupdesc_domain = wasmExports.lookup_rowtype_tupdesc_domain)(e, t2, r), _MemoryContextGetParent = Module._MemoryContextGetParent = (e) => (_MemoryContextGetParent = Module._MemoryContextGetParent = wasmExports.MemoryContextGetParent)(e), _DeleteExpandedObject = Module._DeleteExpandedObject = (e) => (_DeleteExpandedObject = Module._DeleteExpandedObject = wasmExports.DeleteExpandedObject)(e), _ExecFindJunkAttributeInTlist = Module._ExecFindJunkAttributeInTlist = (e, t2) => (_ExecFindJunkAttributeInTlist = Module._ExecFindJunkAttributeInTlist = wasmExports.ExecFindJunkAttributeInTlist)(e, t2), _standard_ExecutorStart = Module._standard_ExecutorStart = (e, t2) => (_standard_ExecutorStart = Module._standard_ExecutorStart = wasmExports.standard_ExecutorStart)(e, t2), _standard_ExecutorRun = Module._standard_ExecutorRun = (e, t2, r, a2) => (_standard_ExecutorRun = Module._standard_ExecutorRun = wasmExports.standard_ExecutorRun)(e, t2, r, a2), _standard_ExecutorFinish = Module._standard_ExecutorFinish = (e) => (_standard_ExecutorFinish = Module._standard_ExecutorFinish = wasmExports.standard_ExecutorFinish)(e), _standard_ExecutorEnd = Module._standard_ExecutorEnd = (e) => (_standard_ExecutorEnd = Module._standard_ExecutorEnd = wasmExports.standard_ExecutorEnd)(e), _InstrAlloc = Module._InstrAlloc = (e, t2, r) => (_InstrAlloc = Module._InstrAlloc = wasmExports.InstrAlloc)(e, t2, r), _MakeTupleTableSlot = Module._MakeTupleTableSlot = (e, t2) => (_MakeTupleTableSlot = Module._MakeTupleTableSlot = wasmExports.MakeTupleTableSlot)(e, t2), _get_typlenbyval = Module._get_typlenbyval = (e, t2, r) => (_get_typlenbyval = Module._get_typlenbyval = wasmExports.get_typlenbyval)(e, t2, r), _bms_num_members = Module._bms_num_members = (e) => (_bms_num_members = Module._bms_num_members = wasmExports.bms_num_members)(e), _InputFunctionCall = Module._InputFunctionCall = (e, t2, r, a2) => (_InputFunctionCall = Module._InputFunctionCall = wasmExports.InputFunctionCall)(e, t2, r, a2), _FreeExprContext = Module._FreeExprContext = (e, t2) => (_FreeExprContext = Module._FreeExprContext = wasmExports.FreeExprContext)(e, t2), _ExecOpenScanRelation = Module._ExecOpenScanRelation = (e, t2, r) => (_ExecOpenScanRelation = Module._ExecOpenScanRelation = wasmExports.ExecOpenScanRelation)(e, t2, r), _bms_intersect = Module._bms_intersect = (e, t2) => (_bms_intersect = Module._bms_intersect = wasmExports.bms_intersect)(e, t2), _ExecGetReturningSlot = Module._ExecGetReturningSlot = (e, t2) => (_ExecGetReturningSlot = Module._ExecGetReturningSlot = wasmExports.ExecGetReturningSlot)(e, t2), _ExecGetResultRelCheckAsUser = Module._ExecGetResultRelCheckAsUser = (e, t2) => (_ExecGetResultRelCheckAsUser = Module._ExecGetResultRelCheckAsUser = wasmExports.ExecGetResultRelCheckAsUser)(e, t2), _get_call_expr_argtype = Module._get_call_expr_argtype = (e, t2) => (_get_call_expr_argtype = Module._get_call_expr_argtype = wasmExports.get_call_expr_argtype)(e, t2), _tuplestore_clear = Module._tuplestore_clear = (e) => (_tuplestore_clear = Module._tuplestore_clear = wasmExports.tuplestore_clear)(e), _InstrUpdateTupleCount = Module._InstrUpdateTupleCount = (e, t2) => (_InstrUpdateTupleCount = Module._InstrUpdateTupleCount = wasmExports.InstrUpdateTupleCount)(e, t2), _tuplesort_begin_heap = Module._tuplesort_begin_heap = (e, t2, r, a2, o4, s4, l3, _3, n3) => (_tuplesort_begin_heap = Module._tuplesort_begin_heap = wasmExports.tuplesort_begin_heap)(e, t2, r, a2, o4, s4, l3, _3, n3), _tuplesort_gettupleslot = Module._tuplesort_gettupleslot = (e, t2, r, a2, o4) => (_tuplesort_gettupleslot = Module._tuplesort_gettupleslot = wasmExports.tuplesort_gettupleslot)(e, t2, r, a2, o4), _AddWaitEventToSet = Module._AddWaitEventToSet = (e, t2, r, a2, o4) => (_AddWaitEventToSet = Module._AddWaitEventToSet = wasmExports.AddWaitEventToSet)(e, t2, r, a2, o4), _GetNumRegisteredWaitEvents = Module._GetNumRegisteredWaitEvents = (e) => (_GetNumRegisteredWaitEvents = Module._GetNumRegisteredWaitEvents = wasmExports.GetNumRegisteredWaitEvents)(e), _get_attstatsslot = Module._get_attstatsslot = (e, t2, r, a2, o4) => (_get_attstatsslot = Module._get_attstatsslot = wasmExports.get_attstatsslot)(e, t2, r, a2, o4), _free_attstatsslot = Module._free_attstatsslot = (e) => (_free_attstatsslot = Module._free_attstatsslot = wasmExports.free_attstatsslot)(e), _tuplesort_reset = Module._tuplesort_reset = (e) => (_tuplesort_reset = Module._tuplesort_reset = wasmExports.tuplesort_reset)(e), _pairingheap_first = Module._pairingheap_first = (e) => (_pairingheap_first = Module._pairingheap_first = wasmExports.pairingheap_first)(e), _bms_nonempty_difference = Module._bms_nonempty_difference = (e, t2) => (_bms_nonempty_difference = Module._bms_nonempty_difference = wasmExports.bms_nonempty_difference)(e, t2), _SPI_connect_ext = Module._SPI_connect_ext = (e) => (_SPI_connect_ext = Module._SPI_connect_ext = wasmExports.SPI_connect_ext)(e), _SPI_commit = Module._SPI_commit = () => (_SPI_commit = Module._SPI_commit = wasmExports.SPI_commit)(), _CopyErrorData = Module._CopyErrorData = () => (_CopyErrorData = Module._CopyErrorData = wasmExports.CopyErrorData)(), _ReThrowError = Module._ReThrowError = (e) => (_ReThrowError = Module._ReThrowError = wasmExports.ReThrowError)(e), _SPI_commit_and_chain = Module._SPI_commit_and_chain = () => (_SPI_commit_and_chain = Module._SPI_commit_and_chain = wasmExports.SPI_commit_and_chain)(), _SPI_rollback = Module._SPI_rollback = () => (_SPI_rollback = Module._SPI_rollback = wasmExports.SPI_rollback)(), _SPI_rollback_and_chain = Module._SPI_rollback_and_chain = () => (_SPI_rollback_and_chain = Module._SPI_rollback_and_chain = wasmExports.SPI_rollback_and_chain)(), _SPI_freetuptable = Module._SPI_freetuptable = (e) => (_SPI_freetuptable = Module._SPI_freetuptable = wasmExports.SPI_freetuptable)(e), _SPI_execute_extended = Module._SPI_execute_extended = (e, t2) => (_SPI_execute_extended = Module._SPI_execute_extended = wasmExports.SPI_execute_extended)(e, t2), _SPI_execute_plan = Module._SPI_execute_plan = (e, t2, r, a2, o4) => (_SPI_execute_plan = Module._SPI_execute_plan = wasmExports.SPI_execute_plan)(e, t2, r, a2, o4), _SPI_execp = Module._SPI_execp = (e, t2, r, a2) => (_SPI_execp = Module._SPI_execp = wasmExports.SPI_execp)(e, t2, r, a2), _SPI_execute_plan_extended = Module._SPI_execute_plan_extended = (e, t2) => (_SPI_execute_plan_extended = Module._SPI_execute_plan_extended = wasmExports.SPI_execute_plan_extended)(e, t2), _SPI_execute_plan_with_paramlist = Module._SPI_execute_plan_with_paramlist = (e, t2, r, a2) => (_SPI_execute_plan_with_paramlist = Module._SPI_execute_plan_with_paramlist = wasmExports.SPI_execute_plan_with_paramlist)(e, t2, r, a2), _SPI_prepare = Module._SPI_prepare = (e, t2, r) => (_SPI_prepare = Module._SPI_prepare = wasmExports.SPI_prepare)(e, t2, r), _SPI_prepare_extended = Module._SPI_prepare_extended = (e, t2) => (_SPI_prepare_extended = Module._SPI_prepare_extended = wasmExports.SPI_prepare_extended)(e, t2), _SPI_keepplan = Module._SPI_keepplan = (e) => (_SPI_keepplan = Module._SPI_keepplan = wasmExports.SPI_keepplan)(e), _SPI_freeplan = Module._SPI_freeplan = (e) => (_SPI_freeplan = Module._SPI_freeplan = wasmExports.SPI_freeplan)(e), _SPI_copytuple = Module._SPI_copytuple = (e) => (_SPI_copytuple = Module._SPI_copytuple = wasmExports.SPI_copytuple)(e), _SPI_returntuple = Module._SPI_returntuple = (e, t2) => (_SPI_returntuple = Module._SPI_returntuple = wasmExports.SPI_returntuple)(e, t2), _SPI_fnumber = Module._SPI_fnumber = (e, t2) => (_SPI_fnumber = Module._SPI_fnumber = wasmExports.SPI_fnumber)(e, t2), _SPI_fname = Module._SPI_fname = (e, t2) => (_SPI_fname = Module._SPI_fname = wasmExports.SPI_fname)(e, t2), _SPI_getbinval = Module._SPI_getbinval = (e, t2, r, a2) => (_SPI_getbinval = Module._SPI_getbinval = wasmExports.SPI_getbinval)(e, t2, r, a2), _SPI_gettype = Module._SPI_gettype = (e, t2) => (_SPI_gettype = Module._SPI_gettype = wasmExports.SPI_gettype)(e, t2), _SPI_gettypeid = Module._SPI_gettypeid = (e, t2) => (_SPI_gettypeid = Module._SPI_gettypeid = wasmExports.SPI_gettypeid)(e, t2), _SPI_getrelname = Module._SPI_getrelname = (e) => (_SPI_getrelname = Module._SPI_getrelname = wasmExports.SPI_getrelname)(e), _SPI_palloc = Module._SPI_palloc = (e) => (_SPI_palloc = Module._SPI_palloc = wasmExports.SPI_palloc)(e), _SPI_datumTransfer = Module._SPI_datumTransfer = (e, t2, r) => (_SPI_datumTransfer = Module._SPI_datumTransfer = wasmExports.SPI_datumTransfer)(e, t2, r), _datumTransfer = Module._datumTransfer = (e, t2, r) => (_datumTransfer = Module._datumTransfer = wasmExports.datumTransfer)(e, t2, r), _SPI_cursor_open_with_paramlist = Module._SPI_cursor_open_with_paramlist = (e, t2, r, a2) => (_SPI_cursor_open_with_paramlist = Module._SPI_cursor_open_with_paramlist = wasmExports.SPI_cursor_open_with_paramlist)(e, t2, r, a2), _SPI_cursor_parse_open = Module._SPI_cursor_parse_open = (e, t2, r) => (_SPI_cursor_parse_open = Module._SPI_cursor_parse_open = wasmExports.SPI_cursor_parse_open)(e, t2, r), _SPI_cursor_find = Module._SPI_cursor_find = (e) => (_SPI_cursor_find = Module._SPI_cursor_find = wasmExports.SPI_cursor_find)(e), _SPI_cursor_fetch = Module._SPI_cursor_fetch = (e, t2, r) => (_SPI_cursor_fetch = Module._SPI_cursor_fetch = wasmExports.SPI_cursor_fetch)(e, t2, r), _SPI_scroll_cursor_fetch = Module._SPI_scroll_cursor_fetch = (e, t2, r) => (_SPI_scroll_cursor_fetch = Module._SPI_scroll_cursor_fetch = wasmExports.SPI_scroll_cursor_fetch)(e, t2, r), _SPI_scroll_cursor_move = Module._SPI_scroll_cursor_move = (e, t2, r) => (_SPI_scroll_cursor_move = Module._SPI_scroll_cursor_move = wasmExports.SPI_scroll_cursor_move)(e, t2, r), _SPI_cursor_close = Module._SPI_cursor_close = (e) => (_SPI_cursor_close = Module._SPI_cursor_close = wasmExports.SPI_cursor_close)(e), _SPI_plan_is_valid = Module._SPI_plan_is_valid = (e) => (_SPI_plan_is_valid = Module._SPI_plan_is_valid = wasmExports.SPI_plan_is_valid)(e), _SPI_result_code_string = Module._SPI_result_code_string = (e) => (_SPI_result_code_string = Module._SPI_result_code_string = wasmExports.SPI_result_code_string)(e), _SPI_plan_get_plan_sources = Module._SPI_plan_get_plan_sources = (e) => (_SPI_plan_get_plan_sources = Module._SPI_plan_get_plan_sources = wasmExports.SPI_plan_get_plan_sources)(e), _SPI_plan_get_cached_plan = Module._SPI_plan_get_cached_plan = (e) => (_SPI_plan_get_cached_plan = Module._SPI_plan_get_cached_plan = wasmExports.SPI_plan_get_cached_plan)(e), _SPI_register_relation = Module._SPI_register_relation = (e) => (_SPI_register_relation = Module._SPI_register_relation = wasmExports.SPI_register_relation)(e), _create_queryEnv = Module._create_queryEnv = () => (_create_queryEnv = Module._create_queryEnv = wasmExports.create_queryEnv)(), _register_ENR = Module._register_ENR = (e, t2) => (_register_ENR = Module._register_ENR = wasmExports.register_ENR)(e, t2), _SPI_register_trigger_data = Module._SPI_register_trigger_data = (e) => (_SPI_register_trigger_data = Module._SPI_register_trigger_data = wasmExports.SPI_register_trigger_data)(e), _tuplestore_tuple_count = Module._tuplestore_tuple_count = (e) => (_tuplestore_tuple_count = Module._tuplestore_tuple_count = wasmExports.tuplestore_tuple_count)(e), _GetUserMapping = Module._GetUserMapping = (e, t2) => (_GetUserMapping = Module._GetUserMapping = wasmExports.GetUserMapping)(e, t2), _GetForeignTable = Module._GetForeignTable = (e) => (_GetForeignTable = Module._GetForeignTable = wasmExports.GetForeignTable)(e), _GetForeignColumnOptions = Module._GetForeignColumnOptions = (e, t2) => (_GetForeignColumnOptions = Module._GetForeignColumnOptions = wasmExports.GetForeignColumnOptions)(e, t2), _initClosestMatch = Module._initClosestMatch = (e, t2, r) => (_initClosestMatch = Module._initClosestMatch = wasmExports.initClosestMatch)(e, t2, r), _updateClosestMatch = Module._updateClosestMatch = (e, t2) => (_updateClosestMatch = Module._updateClosestMatch = wasmExports.updateClosestMatch)(e, t2), _getClosestMatch = Module._getClosestMatch = (e) => (_getClosestMatch = Module._getClosestMatch = wasmExports.getClosestMatch)(e), _GetExistingLocalJoinPath = Module._GetExistingLocalJoinPath = (e) => (_GetExistingLocalJoinPath = Module._GetExistingLocalJoinPath = wasmExports.GetExistingLocalJoinPath)(e), _bloom_create = Module._bloom_create = (e, t2, r) => (_bloom_create = Module._bloom_create = wasmExports.bloom_create)(e, t2, r), _bloom_free = Module._bloom_free = (e) => (_bloom_free = Module._bloom_free = wasmExports.bloom_free)(e), _bloom_add_element = Module._bloom_add_element = (e, t2, r) => (_bloom_add_element = Module._bloom_add_element = wasmExports.bloom_add_element)(e, t2, r), _bloom_lacks_element = Module._bloom_lacks_element = (e, t2, r) => (_bloom_lacks_element = Module._bloom_lacks_element = wasmExports.bloom_lacks_element)(e, t2, r), _bloom_prop_bits_set = Module._bloom_prop_bits_set = (e) => (_bloom_prop_bits_set = Module._bloom_prop_bits_set = wasmExports.bloom_prop_bits_set)(e), _gai_strerror = Module._gai_strerror = (e) => (_gai_strerror = Module._gai_strerror = wasmExports.gai_strerror)(e), _socket = Module._socket = (e, t2, r) => (_socket = Module._socket = wasmExports.socket)(e, t2, r), _bind = Module._bind = (e, t2, r) => (_bind = Module._bind = wasmExports.bind)(e, t2, r), _connect = Module._connect = (e, t2, r) => (_connect = Module._connect = wasmExports.connect)(e, t2, r), _send = Module._send = (e, t2, r, a2) => (_send = Module._send = wasmExports.send)(e, t2, r, a2), _recv = Module._recv = (e, t2, r, a2) => (_recv = Module._recv = wasmExports.recv)(e, t2, r, a2), _sendto = Module._sendto = (e, t2, r, a2, o4, s4) => (_sendto = Module._sendto = wasmExports.sendto)(e, t2, r, a2, o4, s4), _recvfrom = Module._recvfrom = (e, t2, r, a2, o4, s4) => (_recvfrom = Module._recvfrom = wasmExports.recvfrom)(e, t2, r, a2, o4, s4), _be_lo_unlink = Module._be_lo_unlink = (e) => (_be_lo_unlink = Module._be_lo_unlink = wasmExports.be_lo_unlink)(e), _text_to_cstring_buffer = Module._text_to_cstring_buffer = (e, t2, r) => (_text_to_cstring_buffer = Module._text_to_cstring_buffer = wasmExports.text_to_cstring_buffer)(e, t2, r), _feof = Module._feof = (e) => (_feof = Module._feof = wasmExports.feof)(e), _pg_mb2wchar_with_len = Module._pg_mb2wchar_with_len = (e, t2, r) => (_pg_mb2wchar_with_len = Module._pg_mb2wchar_with_len = wasmExports.pg_mb2wchar_with_len)(e, t2, r), _pg_regcomp = Module._pg_regcomp = (e, t2, r, a2, o4) => (_pg_regcomp = Module._pg_regcomp = wasmExports.pg_regcomp)(e, t2, r, a2, o4), _pg_regerror = Module._pg_regerror = (e, t2, r, a2) => (_pg_regerror = Module._pg_regerror = wasmExports.pg_regerror)(e, t2, r, a2), _strcat = Module._strcat = (e, t2) => (_strcat = Module._strcat = wasmExports.strcat)(e, t2), _setsockopt = Module._setsockopt = (e, t2, r, a2, o4) => (_setsockopt = Module._setsockopt = wasmExports.setsockopt)(e, t2, r, a2, o4), _listen = Module._listen = (e, t2) => (_listen = Module._listen = wasmExports.listen)(e, t2), _accept = Module._accept = (e, t2, r) => (_accept = Module._accept = wasmExports.accept)(e, t2, r), _getsockopt = Module._getsockopt = (e, t2, r, a2, o4) => (_getsockopt = Module._getsockopt = wasmExports.getsockopt)(e, t2, r, a2, o4), _pq_sendtext = Module._pq_sendtext = (e, t2, r) => (_pq_sendtext = Module._pq_sendtext = wasmExports.pq_sendtext)(e, t2, r), _pq_sendfloat4 = Module._pq_sendfloat4 = (e, t2) => (_pq_sendfloat4 = Module._pq_sendfloat4 = wasmExports.pq_sendfloat4)(e, t2), _pq_sendfloat8 = Module._pq_sendfloat8 = (e, t2) => (_pq_sendfloat8 = Module._pq_sendfloat8 = wasmExports.pq_sendfloat8)(e, t2), _pq_begintypsend = Module._pq_begintypsend = (e) => (_pq_begintypsend = Module._pq_begintypsend = wasmExports.pq_begintypsend)(e), _pq_endtypsend = Module._pq_endtypsend = (e) => (_pq_endtypsend = Module._pq_endtypsend = wasmExports.pq_endtypsend)(e), _pq_getmsgfloat4 = Module._pq_getmsgfloat4 = (e) => (_pq_getmsgfloat4 = Module._pq_getmsgfloat4 = wasmExports.pq_getmsgfloat4)(e), _pq_getmsgfloat8 = Module._pq_getmsgfloat8 = (e) => (_pq_getmsgfloat8 = Module._pq_getmsgfloat8 = wasmExports.pq_getmsgfloat8)(e), _pq_getmsgtext = Module._pq_getmsgtext = (e, t2, r) => (_pq_getmsgtext = Module._pq_getmsgtext = wasmExports.pq_getmsgtext)(e, t2, r), _pg_strtoint32 = Module._pg_strtoint32 = (e) => (_pg_strtoint32 = Module._pg_strtoint32 = wasmExports.pg_strtoint32)(e), _bms_membership = Module._bms_membership = (e) => (_bms_membership = Module._bms_membership = wasmExports.bms_membership)(e), _list_make5_impl = Module._list_make5_impl = (e, t2, r, a2, o4, s4) => (_list_make5_impl = Module._list_make5_impl = wasmExports.list_make5_impl)(e, t2, r, a2, o4, s4), _lappend_xid = Module._lappend_xid = (e, t2) => (_lappend_xid = Module._lappend_xid = wasmExports.lappend_xid)(e, t2), _list_insert_nth = Module._list_insert_nth = (e, t2, r) => (_list_insert_nth = Module._list_insert_nth = wasmExports.list_insert_nth)(e, t2, r), _list_member_ptr = Module._list_member_ptr = (e, t2) => (_list_member_ptr = Module._list_member_ptr = wasmExports.list_member_ptr)(e, t2), _list_member_xid = Module._list_member_xid = (e, t2) => (_list_member_xid = Module._list_member_xid = wasmExports.list_member_xid)(e, t2), _list_append_unique_ptr = Module._list_append_unique_ptr = (e, t2) => (_list_append_unique_ptr = Module._list_append_unique_ptr = wasmExports.list_append_unique_ptr)(e, t2), _make_opclause = Module._make_opclause = (e, t2, r, a2, o4, s4, l3) => (_make_opclause = Module._make_opclause = wasmExports.make_opclause)(e, t2, r, a2, o4, s4, l3), _exprIsLengthCoercion = Module._exprIsLengthCoercion = (e, t2) => (_exprIsLengthCoercion = Module._exprIsLengthCoercion = wasmExports.exprIsLengthCoercion)(e, t2), _fix_opfuncids = Module._fix_opfuncids = (e) => (_fix_opfuncids = Module._fix_opfuncids = wasmExports.fix_opfuncids)(e), _CleanQuerytext = Module._CleanQuerytext = (e, t2, r) => (_CleanQuerytext = Module._CleanQuerytext = wasmExports.CleanQuerytext)(e, t2, r), _EnableQueryId = Module._EnableQueryId = () => (_EnableQueryId = Module._EnableQueryId = wasmExports.EnableQueryId)(), _find_base_rel = Module._find_base_rel = (e, t2) => (_find_base_rel = Module._find_base_rel = wasmExports.find_base_rel)(e, t2), _add_path = Module._add_path = (e, t2) => (_add_path = Module._add_path = wasmExports.add_path)(e, t2), _pathkeys_contained_in = Module._pathkeys_contained_in = (e, t2) => (_pathkeys_contained_in = Module._pathkeys_contained_in = wasmExports.pathkeys_contained_in)(e, t2), _create_sort_path = Module._create_sort_path = (e, t2, r, a2, o4) => (_create_sort_path = Module._create_sort_path = wasmExports.create_sort_path)(e, t2, r, a2, o4), _set_baserel_size_estimates = Module._set_baserel_size_estimates = (e, t2) => (_set_baserel_size_estimates = Module._set_baserel_size_estimates = wasmExports.set_baserel_size_estimates)(e, t2), _clauselist_selectivity = Module._clauselist_selectivity = (e, t2, r, a2, o4) => (_clauselist_selectivity = Module._clauselist_selectivity = wasmExports.clauselist_selectivity)(e, t2, r, a2, o4), _get_tablespace_page_costs = Module._get_tablespace_page_costs = (e, t2, r) => (_get_tablespace_page_costs = Module._get_tablespace_page_costs = wasmExports.get_tablespace_page_costs)(e, t2, r), _cost_qual_eval = Module._cost_qual_eval = (e, t2, r) => (_cost_qual_eval = Module._cost_qual_eval = wasmExports.cost_qual_eval)(e, t2, r), _estimate_num_groups = Module._estimate_num_groups = (e, t2, r, a2, o4) => (_estimate_num_groups = Module._estimate_num_groups = wasmExports.estimate_num_groups)(e, t2, r, a2, o4), _cost_sort = Module._cost_sort = (e, t2, r, a2, o4, s4, l3, _3, n3) => (_cost_sort = Module._cost_sort = wasmExports.cost_sort)(e, t2, r, a2, o4, s4, l3, _3, n3), _get_sortgrouplist_exprs = Module._get_sortgrouplist_exprs = (e, t2) => (_get_sortgrouplist_exprs = Module._get_sortgrouplist_exprs = wasmExports.get_sortgrouplist_exprs)(e, t2), _make_restrictinfo = Module._make_restrictinfo = (e, t2, r, a2, o4, s4, l3, _3, n3, m5) => (_make_restrictinfo = Module._make_restrictinfo = wasmExports.make_restrictinfo)(e, t2, r, a2, o4, s4, l3, _3, n3, m5), _generate_implied_equalities_for_column = Module._generate_implied_equalities_for_column = (e, t2, r, a2, o4) => (_generate_implied_equalities_for_column = Module._generate_implied_equalities_for_column = wasmExports.generate_implied_equalities_for_column)(e, t2, r, a2, o4), _eclass_useful_for_merging = Module._eclass_useful_for_merging = (e, t2, r) => (_eclass_useful_for_merging = Module._eclass_useful_for_merging = wasmExports.eclass_useful_for_merging)(e, t2, r), _join_clause_is_movable_to = Module._join_clause_is_movable_to = (e, t2) => (_join_clause_is_movable_to = Module._join_clause_is_movable_to = wasmExports.join_clause_is_movable_to)(e, t2), _get_plan_rowmark = Module._get_plan_rowmark = (e, t2) => (_get_plan_rowmark = Module._get_plan_rowmark = wasmExports.get_plan_rowmark)(e, t2), _update_mergeclause_eclasses = Module._update_mergeclause_eclasses = (e, t2) => (_update_mergeclause_eclasses = Module._update_mergeclause_eclasses = wasmExports.update_mergeclause_eclasses)(e, t2), _find_join_rel = Module._find_join_rel = (e, t2) => (_find_join_rel = Module._find_join_rel = wasmExports.find_join_rel)(e, t2), _make_canonical_pathkey = Module._make_canonical_pathkey = (e, t2, r, a2, o4) => (_make_canonical_pathkey = Module._make_canonical_pathkey = wasmExports.make_canonical_pathkey)(e, t2, r, a2, o4), _get_sortgroupref_clause_noerr = Module._get_sortgroupref_clause_noerr = (e, t2) => (_get_sortgroupref_clause_noerr = Module._get_sortgroupref_clause_noerr = wasmExports.get_sortgroupref_clause_noerr)(e, t2), _extract_actual_clauses = Module._extract_actual_clauses = (e, t2) => (_extract_actual_clauses = Module._extract_actual_clauses = wasmExports.extract_actual_clauses)(e, t2), _change_plan_targetlist = Module._change_plan_targetlist = (e, t2, r) => (_change_plan_targetlist = Module._change_plan_targetlist = wasmExports.change_plan_targetlist)(e, t2, r), _make_foreignscan = Module._make_foreignscan = (e, t2, r, a2, o4, s4, l3, _3) => (_make_foreignscan = Module._make_foreignscan = wasmExports.make_foreignscan)(e, t2, r, a2, o4, s4, l3, _3), _tlist_member = Module._tlist_member = (e, t2) => (_tlist_member = Module._tlist_member = wasmExports.tlist_member)(e, t2), _pull_vars_of_level = Module._pull_vars_of_level = (e, t2) => (_pull_vars_of_level = Module._pull_vars_of_level = wasmExports.pull_vars_of_level)(e, t2), _IncrementVarSublevelsUp = Module._IncrementVarSublevelsUp = (e, t2, r) => (_IncrementVarSublevelsUp = Module._IncrementVarSublevelsUp = wasmExports.IncrementVarSublevelsUp)(e, t2, r), _standard_planner = Module._standard_planner = (e, t2, r, a2) => (_standard_planner = Module._standard_planner = wasmExports.standard_planner)(e, t2, r, a2), _get_relids_in_jointree = Module._get_relids_in_jointree = (e, t2, r) => (_get_relids_in_jointree = Module._get_relids_in_jointree = wasmExports.get_relids_in_jointree)(e, t2, r), _add_new_columns_to_pathtarget = Module._add_new_columns_to_pathtarget = (e, t2) => (_add_new_columns_to_pathtarget = Module._add_new_columns_to_pathtarget = wasmExports.add_new_columns_to_pathtarget)(e, t2), _get_agg_clause_costs = Module._get_agg_clause_costs = (e, t2, r) => (_get_agg_clause_costs = Module._get_agg_clause_costs = wasmExports.get_agg_clause_costs)(e, t2, r), _grouping_is_sortable = Module._grouping_is_sortable = (e) => (_grouping_is_sortable = Module._grouping_is_sortable = wasmExports.grouping_is_sortable)(e), _copy_pathtarget = Module._copy_pathtarget = (e) => (_copy_pathtarget = Module._copy_pathtarget = wasmExports.copy_pathtarget)(e), _create_projection_path = Module._create_projection_path = (e, t2, r, a2) => (_create_projection_path = Module._create_projection_path = wasmExports.create_projection_path)(e, t2, r, a2), _GetSysCacheHashValue = Module._GetSysCacheHashValue = (e, t2, r, a2, o4) => (_GetSysCacheHashValue = Module._GetSysCacheHashValue = wasmExports.GetSysCacheHashValue)(e, t2, r, a2, o4), _get_translated_update_targetlist = Module._get_translated_update_targetlist = (e, t2, r, a2) => (_get_translated_update_targetlist = Module._get_translated_update_targetlist = wasmExports.get_translated_update_targetlist)(e, t2, r, a2), _add_row_identity_var = Module._add_row_identity_var = (e, t2, r, a2) => (_add_row_identity_var = Module._add_row_identity_var = wasmExports.add_row_identity_var)(e, t2, r, a2), _get_rel_all_updated_cols = Module._get_rel_all_updated_cols = (e, t2) => (_get_rel_all_updated_cols = Module._get_rel_all_updated_cols = wasmExports.get_rel_all_updated_cols)(e, t2), _get_baserel_parampathinfo = Module._get_baserel_parampathinfo = (e, t2, r) => (_get_baserel_parampathinfo = Module._get_baserel_parampathinfo = wasmExports.get_baserel_parampathinfo)(e, t2, r), _create_foreignscan_path = Module._create_foreignscan_path = (e, t2, r, a2, o4, s4, l3, _3, n3, m5, p4) => (_create_foreignscan_path = Module._create_foreignscan_path = wasmExports.create_foreignscan_path)(e, t2, r, a2, o4, s4, l3, _3, n3, m5, p4), _create_foreign_join_path = Module._create_foreign_join_path = (e, t2, r, a2, o4, s4, l3, _3, n3, m5, p4) => (_create_foreign_join_path = Module._create_foreign_join_path = wasmExports.create_foreign_join_path)(e, t2, r, a2, o4, s4, l3, _3, n3, m5, p4), _create_foreign_upper_path = Module._create_foreign_upper_path = (e, t2, r, a2, o4, s4, l3, _3, n3, m5) => (_create_foreign_upper_path = Module._create_foreign_upper_path = wasmExports.create_foreign_upper_path)(e, t2, r, a2, o4, s4, l3, _3, n3, m5), _adjust_limit_rows_costs = Module._adjust_limit_rows_costs = (e, t2, r, a2, o4) => (_adjust_limit_rows_costs = Module._adjust_limit_rows_costs = wasmExports.adjust_limit_rows_costs)(e, t2, r, a2, o4), _add_to_flat_tlist = Module._add_to_flat_tlist = (e, t2) => (_add_to_flat_tlist = Module._add_to_flat_tlist = wasmExports.add_to_flat_tlist)(e, t2), _get_fn_expr_argtype = Module._get_fn_expr_argtype = (e, t2) => (_get_fn_expr_argtype = Module._get_fn_expr_argtype = wasmExports.get_fn_expr_argtype)(e, t2), _on_shmem_exit = Module._on_shmem_exit = (e, t2) => (_on_shmem_exit = Module._on_shmem_exit = wasmExports.on_shmem_exit)(e, t2), _mmap = Module._mmap = (e, t2, r, a2, o4, s4) => (_mmap = Module._mmap = wasmExports.mmap)(e, t2, r, a2, o4, s4), _munmap = Module._munmap = (e, t2) => (_munmap = Module._munmap = wasmExports.munmap)(e, t2), _SignalHandlerForConfigReload = Module._SignalHandlerForConfigReload = (e) => (_SignalHandlerForConfigReload = Module._SignalHandlerForConfigReload = wasmExports.SignalHandlerForConfigReload)(e), _SignalHandlerForShutdownRequest = Module._SignalHandlerForShutdownRequest = (e) => (_SignalHandlerForShutdownRequest = Module._SignalHandlerForShutdownRequest = wasmExports.SignalHandlerForShutdownRequest)(e), _procsignal_sigusr1_handler = Module._procsignal_sigusr1_handler = (e) => (_procsignal_sigusr1_handler = Module._procsignal_sigusr1_handler = wasmExports.procsignal_sigusr1_handler)(e), _RegisterBackgroundWorker = Module._RegisterBackgroundWorker = (e) => (_RegisterBackgroundWorker = Module._RegisterBackgroundWorker = wasmExports.RegisterBackgroundWorker)(e), _WaitForBackgroundWorkerStartup = Module._WaitForBackgroundWorkerStartup = (e, t2) => (_WaitForBackgroundWorkerStartup = Module._WaitForBackgroundWorkerStartup = wasmExports.WaitForBackgroundWorkerStartup)(e, t2), _GetConfigOption = Module._GetConfigOption = (e, t2, r) => (_GetConfigOption = Module._GetConfigOption = wasmExports.GetConfigOption)(e, t2, r), _fputc = Module._fputc = (e, t2) => (_fputc = Module._fputc = wasmExports.fputc)(e, t2), _toupper = Module._toupper = (e) => (_toupper = Module._toupper = wasmExports.toupper)(e), _pg_reg_getinitialstate = Module._pg_reg_getinitialstate = (e) => (_pg_reg_getinitialstate = Module._pg_reg_getinitialstate = wasmExports.pg_reg_getinitialstate)(e), _pg_reg_getfinalstate = Module._pg_reg_getfinalstate = (e) => (_pg_reg_getfinalstate = Module._pg_reg_getfinalstate = wasmExports.pg_reg_getfinalstate)(e), _pg_reg_getnumoutarcs = Module._pg_reg_getnumoutarcs = (e, t2) => (_pg_reg_getnumoutarcs = Module._pg_reg_getnumoutarcs = wasmExports.pg_reg_getnumoutarcs)(e, t2), _pg_reg_getoutarcs = Module._pg_reg_getoutarcs = (e, t2, r, a2) => (_pg_reg_getoutarcs = Module._pg_reg_getoutarcs = wasmExports.pg_reg_getoutarcs)(e, t2, r, a2), _pg_reg_getnumcolors = Module._pg_reg_getnumcolors = (e) => (_pg_reg_getnumcolors = Module._pg_reg_getnumcolors = wasmExports.pg_reg_getnumcolors)(e), _pg_reg_colorisbegin = Module._pg_reg_colorisbegin = (e, t2) => (_pg_reg_colorisbegin = Module._pg_reg_colorisbegin = wasmExports.pg_reg_colorisbegin)(e, t2), _pg_reg_colorisend = Module._pg_reg_colorisend = (e, t2) => (_pg_reg_colorisend = Module._pg_reg_colorisend = wasmExports.pg_reg_colorisend)(e, t2), _pg_reg_getnumcharacters = Module._pg_reg_getnumcharacters = (e, t2) => (_pg_reg_getnumcharacters = Module._pg_reg_getnumcharacters = wasmExports.pg_reg_getnumcharacters)(e, t2), _pg_reg_getcharacters = Module._pg_reg_getcharacters = (e, t2, r, a2) => (_pg_reg_getcharacters = Module._pg_reg_getcharacters = wasmExports.pg_reg_getcharacters)(e, t2, r, a2), _OutputPluginPrepareWrite = Module._OutputPluginPrepareWrite = (e, t2) => (_OutputPluginPrepareWrite = Module._OutputPluginPrepareWrite = wasmExports.OutputPluginPrepareWrite)(e, t2), _OutputPluginWrite = Module._OutputPluginWrite = (e, t2) => (_OutputPluginWrite = Module._OutputPluginWrite = wasmExports.OutputPluginWrite)(e, t2), _OutputPluginUpdateProgress = Module._OutputPluginUpdateProgress = (e, t2) => (_OutputPluginUpdateProgress = Module._OutputPluginUpdateProgress = wasmExports.OutputPluginUpdateProgress)(e, t2), _array_contains_nulls = Module._array_contains_nulls = (e) => (_array_contains_nulls = Module._array_contains_nulls = wasmExports.array_contains_nulls)(e), _replorigin_by_oid = Module._replorigin_by_oid = (e, t2, r) => (_replorigin_by_oid = Module._replorigin_by_oid = wasmExports.replorigin_by_oid)(e, t2, r), _logicalrep_write_begin = Module._logicalrep_write_begin = (e, t2) => (_logicalrep_write_begin = Module._logicalrep_write_begin = wasmExports.logicalrep_write_begin)(e, t2), _logicalrep_write_commit = Module._logicalrep_write_commit = (e, t2, r) => (_logicalrep_write_commit = Module._logicalrep_write_commit = wasmExports.logicalrep_write_commit)(e, t2, r), _logicalrep_write_begin_prepare = Module._logicalrep_write_begin_prepare = (e, t2) => (_logicalrep_write_begin_prepare = Module._logicalrep_write_begin_prepare = wasmExports.logicalrep_write_begin_prepare)(e, t2), _logicalrep_write_prepare = Module._logicalrep_write_prepare = (e, t2, r) => (_logicalrep_write_prepare = Module._logicalrep_write_prepare = wasmExports.logicalrep_write_prepare)(e, t2, r), _logicalrep_write_commit_prepared = Module._logicalrep_write_commit_prepared = (e, t2, r) => (_logicalrep_write_commit_prepared = Module._logicalrep_write_commit_prepared = wasmExports.logicalrep_write_commit_prepared)(e, t2, r), _logicalrep_write_rollback_prepared = Module._logicalrep_write_rollback_prepared = (e, t2, r, a2) => (_logicalrep_write_rollback_prepared = Module._logicalrep_write_rollback_prepared = wasmExports.logicalrep_write_rollback_prepared)(e, t2, r, a2), _logicalrep_write_stream_prepare = Module._logicalrep_write_stream_prepare = (e, t2, r) => (_logicalrep_write_stream_prepare = Module._logicalrep_write_stream_prepare = wasmExports.logicalrep_write_stream_prepare)(e, t2, r), _logicalrep_write_origin = Module._logicalrep_write_origin = (e, t2, r) => (_logicalrep_write_origin = Module._logicalrep_write_origin = wasmExports.logicalrep_write_origin)(e, t2, r), _logicalrep_write_insert = Module._logicalrep_write_insert = (e, t2, r, a2, o4, s4) => (_logicalrep_write_insert = Module._logicalrep_write_insert = wasmExports.logicalrep_write_insert)(e, t2, r, a2, o4, s4), _logicalrep_write_update = Module._logicalrep_write_update = (e, t2, r, a2, o4, s4, l3) => (_logicalrep_write_update = Module._logicalrep_write_update = wasmExports.logicalrep_write_update)(e, t2, r, a2, o4, s4, l3), _logicalrep_write_delete = Module._logicalrep_write_delete = (e, t2, r, a2, o4, s4) => (_logicalrep_write_delete = Module._logicalrep_write_delete = wasmExports.logicalrep_write_delete)(e, t2, r, a2, o4, s4), _logicalrep_write_truncate = Module._logicalrep_write_truncate = (e, t2, r, a2, o4, s4) => (_logicalrep_write_truncate = Module._logicalrep_write_truncate = wasmExports.logicalrep_write_truncate)(e, t2, r, a2, o4, s4), _logicalrep_write_message = Module._logicalrep_write_message = (e, t2, r, a2, o4, s4, l3) => (_logicalrep_write_message = Module._logicalrep_write_message = wasmExports.logicalrep_write_message)(e, t2, r, a2, o4, s4, l3), _logicalrep_write_rel = Module._logicalrep_write_rel = (e, t2, r, a2) => (_logicalrep_write_rel = Module._logicalrep_write_rel = wasmExports.logicalrep_write_rel)(e, t2, r, a2), _logicalrep_write_typ = Module._logicalrep_write_typ = (e, t2, r) => (_logicalrep_write_typ = Module._logicalrep_write_typ = wasmExports.logicalrep_write_typ)(e, t2, r), _logicalrep_write_stream_start = Module._logicalrep_write_stream_start = (e, t2, r) => (_logicalrep_write_stream_start = Module._logicalrep_write_stream_start = wasmExports.logicalrep_write_stream_start)(e, t2, r), _logicalrep_write_stream_stop = Module._logicalrep_write_stream_stop = (e) => (_logicalrep_write_stream_stop = Module._logicalrep_write_stream_stop = wasmExports.logicalrep_write_stream_stop)(e), _logicalrep_write_stream_commit = Module._logicalrep_write_stream_commit = (e, t2, r) => (_logicalrep_write_stream_commit = Module._logicalrep_write_stream_commit = wasmExports.logicalrep_write_stream_commit)(e, t2, r), _logicalrep_write_stream_abort = Module._logicalrep_write_stream_abort = (e, t2, r, a2, o4, s4) => (_logicalrep_write_stream_abort = Module._logicalrep_write_stream_abort = wasmExports.logicalrep_write_stream_abort)(e, t2, r, a2, o4, s4), _CacheRegisterRelcacheCallback = Module._CacheRegisterRelcacheCallback = (e, t2) => (_CacheRegisterRelcacheCallback = Module._CacheRegisterRelcacheCallback = wasmExports.CacheRegisterRelcacheCallback)(e, t2), _hash_seq_term = Module._hash_seq_term = (e) => (_hash_seq_term = Module._hash_seq_term = wasmExports.hash_seq_term)(e), _FreeErrorData = Module._FreeErrorData = (e) => (_FreeErrorData = Module._FreeErrorData = wasmExports.FreeErrorData)(e), _RelidByRelfilenumber = Module._RelidByRelfilenumber = (e, t2) => (_RelidByRelfilenumber = Module._RelidByRelfilenumber = wasmExports.RelidByRelfilenumber)(e, t2), _WaitLatchOrSocket = Module._WaitLatchOrSocket = (e, t2, r, a2, o4) => (_WaitLatchOrSocket = Module._WaitLatchOrSocket = wasmExports.WaitLatchOrSocket)(e, t2, r, a2, o4), _ProcessWalRcvInterrupts = Module._ProcessWalRcvInterrupts = () => (_ProcessWalRcvInterrupts = Module._ProcessWalRcvInterrupts = wasmExports.ProcessWalRcvInterrupts)(), _get_row_security_policies = Module._get_row_security_policies = (e, t2, r, a2, o4, s4, l3) => (_get_row_security_policies = Module._get_row_security_policies = wasmExports.get_row_security_policies)(e, t2, r, a2, o4, s4, l3), _hash_estimate_size = Module._hash_estimate_size = (e, t2) => (_hash_estimate_size = Module._hash_estimate_size = wasmExports.hash_estimate_size)(e, t2), _ShmemInitHash = Module._ShmemInitHash = (e, t2, r, a2, o4) => (_ShmemInitHash = Module._ShmemInitHash = wasmExports.ShmemInitHash)(e, t2, r, a2, o4), _LockBufHdr = Module._LockBufHdr = (e) => (_LockBufHdr = Module._LockBufHdr = wasmExports.LockBufHdr)(e), _EvictUnpinnedBuffer = Module._EvictUnpinnedBuffer = (e) => (_EvictUnpinnedBuffer = Module._EvictUnpinnedBuffer = wasmExports.EvictUnpinnedBuffer)(e), _have_free_buffer = Module._have_free_buffer = () => (_have_free_buffer = Module._have_free_buffer = wasmExports.have_free_buffer)(), _copy_file = Module._copy_file = (e, t2) => (_copy_file = Module._copy_file = wasmExports.copy_file)(e, t2), _AcquireExternalFD = Module._AcquireExternalFD = () => (_AcquireExternalFD = Module._AcquireExternalFD = wasmExports.AcquireExternalFD)(), _GetNamedDSMSegment = Module._GetNamedDSMSegment = (e, t2, r, a2) => (_GetNamedDSMSegment = Module._GetNamedDSMSegment = wasmExports.GetNamedDSMSegment)(e, t2, r, a2), _RequestAddinShmemSpace = Module._RequestAddinShmemSpace = (e) => (_RequestAddinShmemSpace = Module._RequestAddinShmemSpace = wasmExports.RequestAddinShmemSpace)(e), _poll = Module._poll = (e, t2, r) => (_poll = Module._poll = wasmExports.poll)(e, t2, r), _GetRunningTransactionData = Module._GetRunningTransactionData = () => (_GetRunningTransactionData = Module._GetRunningTransactionData = wasmExports.GetRunningTransactionData)(), _BackendXidGetPid = Module._BackendXidGetPid = (e) => (_BackendXidGetPid = Module._BackendXidGetPid = wasmExports.BackendXidGetPid)(e), _LWLockRegisterTranche = Module._LWLockRegisterTranche = (e, t2) => (_LWLockRegisterTranche = Module._LWLockRegisterTranche = wasmExports.LWLockRegisterTranche)(e, t2), _GetNamedLWLockTranche = Module._GetNamedLWLockTranche = (e) => (_GetNamedLWLockTranche = Module._GetNamedLWLockTranche = wasmExports.GetNamedLWLockTranche)(e), _LWLockNewTrancheId = Module._LWLockNewTrancheId = () => (_LWLockNewTrancheId = Module._LWLockNewTrancheId = wasmExports.LWLockNewTrancheId)(), _RequestNamedLWLockTranche = Module._RequestNamedLWLockTranche = (e, t2) => (_RequestNamedLWLockTranche = Module._RequestNamedLWLockTranche = wasmExports.RequestNamedLWLockTranche)(e, t2), _standard_ProcessUtility = Module._standard_ProcessUtility = (e, t2, r, a2, o4, s4, l3, _3) => (_standard_ProcessUtility = Module._standard_ProcessUtility = wasmExports.standard_ProcessUtility)(e, t2, r, a2, o4, s4, l3, _3), _lookup_ts_dictionary_cache = Module._lookup_ts_dictionary_cache = (e) => (_lookup_ts_dictionary_cache = Module._lookup_ts_dictionary_cache = wasmExports.lookup_ts_dictionary_cache)(e), _get_tsearch_config_filename = Module._get_tsearch_config_filename = (e, t2) => (_get_tsearch_config_filename = Module._get_tsearch_config_filename = wasmExports.get_tsearch_config_filename)(e, t2), _lowerstr = Module._lowerstr = (e) => (_lowerstr = Module._lowerstr = wasmExports.lowerstr)(e), _readstoplist = Module._readstoplist = (e, t2, r) => (_readstoplist = Module._readstoplist = wasmExports.readstoplist)(e, t2, r), _lowerstr_with_len = Module._lowerstr_with_len = (e, t2) => (_lowerstr_with_len = Module._lowerstr_with_len = wasmExports.lowerstr_with_len)(e, t2), _searchstoplist = Module._searchstoplist = (e, t2) => (_searchstoplist = Module._searchstoplist = wasmExports.searchstoplist)(e, t2), _tsearch_readline_begin = Module._tsearch_readline_begin = (e, t2) => (_tsearch_readline_begin = Module._tsearch_readline_begin = wasmExports.tsearch_readline_begin)(e, t2), _tsearch_readline = Module._tsearch_readline = (e) => (_tsearch_readline = Module._tsearch_readline = wasmExports.tsearch_readline)(e), _t_isspace = Module._t_isspace = (e) => (_t_isspace = Module._t_isspace = wasmExports.t_isspace)(e), _tsearch_readline_end = Module._tsearch_readline_end = (e) => (_tsearch_readline_end = Module._tsearch_readline_end = wasmExports.tsearch_readline_end)(e), _stringToQualifiedNameList = Module._stringToQualifiedNameList = (e, t2) => (_stringToQualifiedNameList = Module._stringToQualifiedNameList = wasmExports.stringToQualifiedNameList)(e, t2), _t_isdigit = Module._t_isdigit = (e) => (_t_isdigit = Module._t_isdigit = wasmExports.t_isdigit)(e), _t_isalnum = Module._t_isalnum = (e) => (_t_isalnum = Module._t_isalnum = wasmExports.t_isalnum)(e), _get_restriction_variable = Module._get_restriction_variable = (e, t2, r, a2, o4, s4) => (_get_restriction_variable = Module._get_restriction_variable = wasmExports.get_restriction_variable)(e, t2, r, a2, o4, s4), _MemoryContextAllocHuge = Module._MemoryContextAllocHuge = (e, t2) => (_MemoryContextAllocHuge = Module._MemoryContextAllocHuge = wasmExports.MemoryContextAllocHuge)(e, t2), _WaitEventExtensionNew = Module._WaitEventExtensionNew = (e) => (_WaitEventExtensionNew = Module._WaitEventExtensionNew = wasmExports.WaitEventExtensionNew)(e), _expand_array = Module._expand_array = (e, t2, r) => (_expand_array = Module._expand_array = wasmExports.expand_array)(e, t2, r), _arraycontsel = Module._arraycontsel = (e) => (_arraycontsel = Module._arraycontsel = wasmExports.arraycontsel)(e), _arraycontjoinsel = Module._arraycontjoinsel = (e) => (_arraycontjoinsel = Module._arraycontjoinsel = wasmExports.arraycontjoinsel)(e), _initArrayResult = Module._initArrayResult = (e, t2, r) => (_initArrayResult = Module._initArrayResult = wasmExports.initArrayResult)(e, t2, r), _array_create_iterator = Module._array_create_iterator = (e, t2, r) => (_array_create_iterator = Module._array_create_iterator = wasmExports.array_create_iterator)(e, t2, r), _array_iterate = Module._array_iterate = (e, t2, r) => (_array_iterate = Module._array_iterate = wasmExports.array_iterate)(e, t2, r), _ArrayGetIntegerTypmods = Module._ArrayGetIntegerTypmods = (e, t2) => (_ArrayGetIntegerTypmods = Module._ArrayGetIntegerTypmods = wasmExports.ArrayGetIntegerTypmods)(e, t2), _boolin = Module._boolin = (e) => (_boolin = Module._boolin = wasmExports.boolin)(e), _cash_cmp = Module._cash_cmp = (e) => (_cash_cmp = Module._cash_cmp = wasmExports.cash_cmp)(e), _int64_to_numeric = Module._int64_to_numeric = (e) => (_int64_to_numeric = Module._int64_to_numeric = wasmExports.int64_to_numeric)(e), _numeric_div = Module._numeric_div = (e) => (_numeric_div = Module._numeric_div = wasmExports.numeric_div)(e), _date_eq = Module._date_eq = (e) => (_date_eq = Module._date_eq = wasmExports.date_eq)(e), _date_lt = Module._date_lt = (e) => (_date_lt = Module._date_lt = wasmExports.date_lt)(e), _date_le = Module._date_le = (e) => (_date_le = Module._date_le = wasmExports.date_le)(e), _date_gt = Module._date_gt = (e) => (_date_gt = Module._date_gt = wasmExports.date_gt)(e), _date_ge = Module._date_ge = (e) => (_date_ge = Module._date_ge = wasmExports.date_ge)(e), _date_cmp = Module._date_cmp = (e) => (_date_cmp = Module._date_cmp = wasmExports.date_cmp)(e), _date_mi = Module._date_mi = (e) => (_date_mi = Module._date_mi = wasmExports.date_mi)(e), _time_eq = Module._time_eq = (e) => (_time_eq = Module._time_eq = wasmExports.time_eq)(e), _time_lt = Module._time_lt = (e) => (_time_lt = Module._time_lt = wasmExports.time_lt)(e), _time_le = Module._time_le = (e) => (_time_le = Module._time_le = wasmExports.time_le)(e), _time_gt = Module._time_gt = (e) => (_time_gt = Module._time_gt = wasmExports.time_gt)(e), _time_ge = Module._time_ge = (e) => (_time_ge = Module._time_ge = wasmExports.time_ge)(e), _time_cmp = Module._time_cmp = (e) => (_time_cmp = Module._time_cmp = wasmExports.time_cmp)(e), _time_mi_time = Module._time_mi_time = (e) => (_time_mi_time = Module._time_mi_time = wasmExports.time_mi_time)(e), _timetz_cmp = Module._timetz_cmp = (e) => (_timetz_cmp = Module._timetz_cmp = wasmExports.timetz_cmp)(e), _TransferExpandedObject = Module._TransferExpandedObject = (e, t2) => (_TransferExpandedObject = Module._TransferExpandedObject = wasmExports.TransferExpandedObject)(e, t2), _numeric_lt = Module._numeric_lt = (e) => (_numeric_lt = Module._numeric_lt = wasmExports.numeric_lt)(e), _numeric_ge = Module._numeric_ge = (e) => (_numeric_ge = Module._numeric_ge = wasmExports.numeric_ge)(e), _err_generic_string = Module._err_generic_string = (e, t2) => (_err_generic_string = Module._err_generic_string = wasmExports.err_generic_string)(e, t2), _domain_check = Module._domain_check = (e, t2, r, a2, o4) => (_domain_check = Module._domain_check = wasmExports.domain_check)(e, t2, r, a2, o4), _enum_lt = Module._enum_lt = (e) => (_enum_lt = Module._enum_lt = wasmExports.enum_lt)(e), _enum_le = Module._enum_le = (e) => (_enum_le = Module._enum_le = wasmExports.enum_le)(e), _enum_ge = Module._enum_ge = (e) => (_enum_ge = Module._enum_ge = wasmExports.enum_ge)(e), _enum_gt = Module._enum_gt = (e) => (_enum_gt = Module._enum_gt = wasmExports.enum_gt)(e), _enum_cmp = Module._enum_cmp = (e) => (_enum_cmp = Module._enum_cmp = wasmExports.enum_cmp)(e), _make_expanded_record_from_typeid = Module._make_expanded_record_from_typeid = (e, t2, r) => (_make_expanded_record_from_typeid = Module._make_expanded_record_from_typeid = wasmExports.make_expanded_record_from_typeid)(e, t2, r), _MemoryContextRegisterResetCallback = Module._MemoryContextRegisterResetCallback = (e, t2) => (_MemoryContextRegisterResetCallback = Module._MemoryContextRegisterResetCallback = wasmExports.MemoryContextRegisterResetCallback)(e, t2), _make_expanded_record_from_tupdesc = Module._make_expanded_record_from_tupdesc = (e, t2) => (_make_expanded_record_from_tupdesc = Module._make_expanded_record_from_tupdesc = wasmExports.make_expanded_record_from_tupdesc)(e, t2), _make_expanded_record_from_exprecord = Module._make_expanded_record_from_exprecord = (e, t2) => (_make_expanded_record_from_exprecord = Module._make_expanded_record_from_exprecord = wasmExports.make_expanded_record_from_exprecord)(e, t2), _expanded_record_set_tuple = Module._expanded_record_set_tuple = (e, t2, r, a2) => (_expanded_record_set_tuple = Module._expanded_record_set_tuple = wasmExports.expanded_record_set_tuple)(e, t2, r, a2), _expanded_record_get_tuple = Module._expanded_record_get_tuple = (e) => (_expanded_record_get_tuple = Module._expanded_record_get_tuple = wasmExports.expanded_record_get_tuple)(e), _deconstruct_expanded_record = Module._deconstruct_expanded_record = (e) => (_deconstruct_expanded_record = Module._deconstruct_expanded_record = wasmExports.deconstruct_expanded_record)(e), _expanded_record_lookup_field = Module._expanded_record_lookup_field = (e, t2, r) => (_expanded_record_lookup_field = Module._expanded_record_lookup_field = wasmExports.expanded_record_lookup_field)(e, t2, r), _expanded_record_set_field_internal = Module._expanded_record_set_field_internal = (e, t2, r, a2, o4, s4) => (_expanded_record_set_field_internal = Module._expanded_record_set_field_internal = wasmExports.expanded_record_set_field_internal)(e, t2, r, a2, o4, s4), _expanded_record_set_fields = Module._expanded_record_set_fields = (e, t2, r, a2) => (_expanded_record_set_fields = Module._expanded_record_set_fields = wasmExports.expanded_record_set_fields)(e, t2, r, a2), _float4in_internal = Module._float4in_internal = (e, t2, r, a2, o4) => (_float4in_internal = Module._float4in_internal = wasmExports.float4in_internal)(e, t2, r, a2, o4), _strtof = Module._strtof = (e, t2) => (_strtof = Module._strtof = wasmExports.strtof)(e, t2), _float8in_internal = Module._float8in_internal = (e, t2, r, a2, o4) => (_float8in_internal = Module._float8in_internal = wasmExports.float8in_internal)(e, t2, r, a2, o4), _float8out_internal = Module._float8out_internal = (e) => (_float8out_internal = Module._float8out_internal = wasmExports.float8out_internal)(e), _btfloat4cmp = Module._btfloat4cmp = (e) => (_btfloat4cmp = Module._btfloat4cmp = wasmExports.btfloat4cmp)(e), _btfloat8cmp = Module._btfloat8cmp = (e) => (_btfloat8cmp = Module._btfloat8cmp = wasmExports.btfloat8cmp)(e), _log10 = Module._log10 = (e) => (_log10 = Module._log10 = wasmExports.log10)(e), _acos = Module._acos = (e) => (_acos = Module._acos = wasmExports.acos)(e), _asin = Module._asin = (e) => (_asin = Module._asin = wasmExports.asin)(e), _cos = Module._cos = (e) => (_cos = Module._cos = wasmExports.cos)(e), _fmod = Module._fmod = (e, t2) => (_fmod = Module._fmod = wasmExports.fmod)(e, t2), _str_tolower = Module._str_tolower = (e, t2, r) => (_str_tolower = Module._str_tolower = wasmExports.str_tolower)(e, t2, r), _pushJsonbValue = Module._pushJsonbValue = (e, t2, r) => (_pushJsonbValue = Module._pushJsonbValue = wasmExports.pushJsonbValue)(e, t2, r), _numeric_float4 = Module._numeric_float4 = (e) => (_numeric_float4 = Module._numeric_float4 = wasmExports.numeric_float4)(e), _numeric_cmp = Module._numeric_cmp = (e) => (_numeric_cmp = Module._numeric_cmp = wasmExports.numeric_cmp)(e), _numeric_eq = Module._numeric_eq = (e) => (_numeric_eq = Module._numeric_eq = wasmExports.numeric_eq)(e), _numeric_is_nan = Module._numeric_is_nan = (e) => (_numeric_is_nan = Module._numeric_is_nan = wasmExports.numeric_is_nan)(e), _timestamp_cmp = Module._timestamp_cmp = (e) => (_timestamp_cmp = Module._timestamp_cmp = wasmExports.timestamp_cmp)(e), _macaddr_cmp = Module._macaddr_cmp = (e) => (_macaddr_cmp = Module._macaddr_cmp = wasmExports.macaddr_cmp)(e), _macaddr_lt = Module._macaddr_lt = (e) => (_macaddr_lt = Module._macaddr_lt = wasmExports.macaddr_lt)(e), _macaddr_le = Module._macaddr_le = (e) => (_macaddr_le = Module._macaddr_le = wasmExports.macaddr_le)(e), _macaddr_eq = Module._macaddr_eq = (e) => (_macaddr_eq = Module._macaddr_eq = wasmExports.macaddr_eq)(e), _macaddr_ge = Module._macaddr_ge = (e) => (_macaddr_ge = Module._macaddr_ge = wasmExports.macaddr_ge)(e), _macaddr_gt = Module._macaddr_gt = (e) => (_macaddr_gt = Module._macaddr_gt = wasmExports.macaddr_gt)(e), _macaddr8_cmp = Module._macaddr8_cmp = (e) => (_macaddr8_cmp = Module._macaddr8_cmp = wasmExports.macaddr8_cmp)(e), _macaddr8_lt = Module._macaddr8_lt = (e) => (_macaddr8_lt = Module._macaddr8_lt = wasmExports.macaddr8_lt)(e), _macaddr8_le = Module._macaddr8_le = (e) => (_macaddr8_le = Module._macaddr8_le = wasmExports.macaddr8_le)(e), _macaddr8_eq = Module._macaddr8_eq = (e) => (_macaddr8_eq = Module._macaddr8_eq = wasmExports.macaddr8_eq)(e), _macaddr8_ge = Module._macaddr8_ge = (e) => (_macaddr8_ge = Module._macaddr8_ge = wasmExports.macaddr8_ge)(e), _macaddr8_gt = Module._macaddr8_gt = (e) => (_macaddr8_gt = Module._macaddr8_gt = wasmExports.macaddr8_gt)(e), _current_query = Module._current_query = (e) => (_current_query = Module._current_query = wasmExports.current_query)(e), _unpack_sql_state = Module._unpack_sql_state = (e) => (_unpack_sql_state = Module._unpack_sql_state = wasmExports.unpack_sql_state)(e), _get_fn_expr_rettype = Module._get_fn_expr_rettype = (e) => (_get_fn_expr_rettype = Module._get_fn_expr_rettype = wasmExports.get_fn_expr_rettype)(e), _btnamecmp = Module._btnamecmp = (e) => (_btnamecmp = Module._btnamecmp = wasmExports.btnamecmp)(e), _inet_in = Module._inet_in = (e) => (_inet_in = Module._inet_in = wasmExports.inet_in)(e), _network_cmp = Module._network_cmp = (e) => (_network_cmp = Module._network_cmp = wasmExports.network_cmp)(e), _convert_network_to_scalar = Module._convert_network_to_scalar = (e, t2, r) => (_convert_network_to_scalar = Module._convert_network_to_scalar = wasmExports.convert_network_to_scalar)(e, t2, r), _numeric_gt = Module._numeric_gt = (e) => (_numeric_gt = Module._numeric_gt = wasmExports.numeric_gt)(e), _numeric_le = Module._numeric_le = (e) => (_numeric_le = Module._numeric_le = wasmExports.numeric_le)(e), _numeric_float8_no_overflow = Module._numeric_float8_no_overflow = (e) => (_numeric_float8_no_overflow = Module._numeric_float8_no_overflow = wasmExports.numeric_float8_no_overflow)(e), _oidout = Module._oidout = (e) => (_oidout = Module._oidout = wasmExports.oidout)(e), _interval_mi = Module._interval_mi = (e) => (_interval_mi = Module._interval_mi = wasmExports.interval_mi)(e), _localtime = Module._localtime = (e) => (_localtime = Module._localtime = wasmExports.localtime)(e), _newlocale = Module._newlocale = (e, t2, r) => (_newlocale = Module._newlocale = wasmExports.newlocale)(e, t2, r), _quote_ident = Module._quote_ident = (e) => (_quote_ident = Module._quote_ident = wasmExports.quote_ident)(e), _pg_wchar2mb_with_len = Module._pg_wchar2mb_with_len = (e, t2, r) => (_pg_wchar2mb_with_len = Module._pg_wchar2mb_with_len = wasmExports.pg_wchar2mb_with_len)(e, t2, r), _pg_get_indexdef_columns_extended = Module._pg_get_indexdef_columns_extended = (e, t2) => (_pg_get_indexdef_columns_extended = Module._pg_get_indexdef_columns_extended = wasmExports.pg_get_indexdef_columns_extended)(e, t2), _pg_get_querydef = Module._pg_get_querydef = (e, t2) => (_pg_get_querydef = Module._pg_get_querydef = wasmExports.pg_get_querydef)(e, t2), _strcspn = Module._strcspn = (e, t2) => (_strcspn = Module._strcspn = wasmExports.strcspn)(e, t2), _generic_restriction_selectivity = Module._generic_restriction_selectivity = (e, t2, r, a2, o4, s4) => (_generic_restriction_selectivity = Module._generic_restriction_selectivity = wasmExports.generic_restriction_selectivity)(e, t2, r, a2, o4, s4), _genericcostestimate = Module._genericcostestimate = (e, t2, r, a2) => (_genericcostestimate = Module._genericcostestimate = wasmExports.genericcostestimate)(e, t2, r, a2), _tidin = Module._tidin = (e) => (_tidin = Module._tidin = wasmExports.tidin)(e), _tidout = Module._tidout = (e) => (_tidout = Module._tidout = wasmExports.tidout)(e), _timestamp_in = Module._timestamp_in = (e) => (_timestamp_in = Module._timestamp_in = wasmExports.timestamp_in)(e), _timestamp_eq = Module._timestamp_eq = (e) => (_timestamp_eq = Module._timestamp_eq = wasmExports.timestamp_eq)(e), _timestamp_lt = Module._timestamp_lt = (e) => (_timestamp_lt = Module._timestamp_lt = wasmExports.timestamp_lt)(e), _timestamp_gt = Module._timestamp_gt = (e) => (_timestamp_gt = Module._timestamp_gt = wasmExports.timestamp_gt)(e), _timestamp_le = Module._timestamp_le = (e) => (_timestamp_le = Module._timestamp_le = wasmExports.timestamp_le)(e), _timestamp_ge = Module._timestamp_ge = (e) => (_timestamp_ge = Module._timestamp_ge = wasmExports.timestamp_ge)(e), _interval_eq = Module._interval_eq = (e) => (_interval_eq = Module._interval_eq = wasmExports.interval_eq)(e), _interval_lt = Module._interval_lt = (e) => (_interval_lt = Module._interval_lt = wasmExports.interval_lt)(e), _interval_gt = Module._interval_gt = (e) => (_interval_gt = Module._interval_gt = wasmExports.interval_gt)(e), _interval_le = Module._interval_le = (e) => (_interval_le = Module._interval_le = wasmExports.interval_le)(e), _interval_ge = Module._interval_ge = (e) => (_interval_ge = Module._interval_ge = wasmExports.interval_ge)(e), _interval_cmp = Module._interval_cmp = (e) => (_interval_cmp = Module._interval_cmp = wasmExports.interval_cmp)(e), _timestamp_mi = Module._timestamp_mi = (e) => (_timestamp_mi = Module._timestamp_mi = wasmExports.timestamp_mi)(e), _interval_um = Module._interval_um = (e) => (_interval_um = Module._interval_um = wasmExports.interval_um)(e), _has_fn_opclass_options = Module._has_fn_opclass_options = (e) => (_has_fn_opclass_options = Module._has_fn_opclass_options = wasmExports.has_fn_opclass_options)(e), _uuid_in = Module._uuid_in = (e) => (_uuid_in = Module._uuid_in = wasmExports.uuid_in)(e), _uuid_out = Module._uuid_out = (e) => (_uuid_out = Module._uuid_out = wasmExports.uuid_out)(e), _uuid_cmp = Module._uuid_cmp = (e) => (_uuid_cmp = Module._uuid_cmp = wasmExports.uuid_cmp)(e), _gen_random_uuid = Module._gen_random_uuid = (e) => (_gen_random_uuid = Module._gen_random_uuid = wasmExports.gen_random_uuid)(e), _varbit_in = Module._varbit_in = (e) => (_varbit_in = Module._varbit_in = wasmExports.varbit_in)(e), _biteq = Module._biteq = (e) => (_biteq = Module._biteq = wasmExports.biteq)(e), _bitlt = Module._bitlt = (e) => (_bitlt = Module._bitlt = wasmExports.bitlt)(e), _bitle = Module._bitle = (e) => (_bitle = Module._bitle = wasmExports.bitle)(e), _bitgt = Module._bitgt = (e) => (_bitgt = Module._bitgt = wasmExports.bitgt)(e), _bitge = Module._bitge = (e) => (_bitge = Module._bitge = wasmExports.bitge)(e), _bitcmp = Module._bitcmp = (e) => (_bitcmp = Module._bitcmp = wasmExports.bitcmp)(e), _bpchareq = Module._bpchareq = (e) => (_bpchareq = Module._bpchareq = wasmExports.bpchareq)(e), _bpcharlt = Module._bpcharlt = (e) => (_bpcharlt = Module._bpcharlt = wasmExports.bpcharlt)(e), _bpcharle = Module._bpcharle = (e) => (_bpcharle = Module._bpcharle = wasmExports.bpcharle)(e), _bpchargt = Module._bpchargt = (e) => (_bpchargt = Module._bpchargt = wasmExports.bpchargt)(e), _bpcharge = Module._bpcharge = (e) => (_bpcharge = Module._bpcharge = wasmExports.bpcharge)(e), _bpcharcmp = Module._bpcharcmp = (e) => (_bpcharcmp = Module._bpcharcmp = wasmExports.bpcharcmp)(e), _texteq = Module._texteq = (e) => (_texteq = Module._texteq = wasmExports.texteq)(e), _text_lt = Module._text_lt = (e) => (_text_lt = Module._text_lt = wasmExports.text_lt)(e), _text_le = Module._text_le = (e) => (_text_le = Module._text_le = wasmExports.text_le)(e), _text_gt = Module._text_gt = (e) => (_text_gt = Module._text_gt = wasmExports.text_gt)(e), _text_ge = Module._text_ge = (e) => (_text_ge = Module._text_ge = wasmExports.text_ge)(e), _bttextcmp = Module._bttextcmp = (e) => (_bttextcmp = Module._bttextcmp = wasmExports.bttextcmp)(e), _byteaeq = Module._byteaeq = (e) => (_byteaeq = Module._byteaeq = wasmExports.byteaeq)(e), _bytealt = Module._bytealt = (e) => (_bytealt = Module._bytealt = wasmExports.bytealt)(e), _byteale = Module._byteale = (e) => (_byteale = Module._byteale = wasmExports.byteale)(e), _byteagt = Module._byteagt = (e) => (_byteagt = Module._byteagt = wasmExports.byteagt)(e), _byteage = Module._byteage = (e) => (_byteage = Module._byteage = wasmExports.byteage)(e), _byteacmp = Module._byteacmp = (e) => (_byteacmp = Module._byteacmp = wasmExports.byteacmp)(e), _to_hex32 = Module._to_hex32 = (e) => (_to_hex32 = Module._to_hex32 = wasmExports.to_hex32)(e), _varstr_levenshtein = Module._varstr_levenshtein = (e, t2, r, a2, o4, s4, l3, _3) => (_varstr_levenshtein = Module._varstr_levenshtein = wasmExports.varstr_levenshtein)(e, t2, r, a2, o4, s4, l3, _3), _pg_xml_init = Module._pg_xml_init = (e) => (_pg_xml_init = Module._pg_xml_init = wasmExports.pg_xml_init)(e), _xmlInitParser = Module._xmlInitParser = () => (_xmlInitParser = Module._xmlInitParser = wasmExports.xmlInitParser)(), _xml_ereport = Module._xml_ereport = (e, t2, r, a2) => (_xml_ereport = Module._xml_ereport = wasmExports.xml_ereport)(e, t2, r, a2), _pg_xml_done = Module._pg_xml_done = (e, t2) => (_pg_xml_done = Module._pg_xml_done = wasmExports.pg_xml_done)(e, t2), _xmlXPathNewContext = Module._xmlXPathNewContext = (e) => (_xmlXPathNewContext = Module._xmlXPathNewContext = wasmExports.xmlXPathNewContext)(e), _xmlXPathFreeContext = Module._xmlXPathFreeContext = (e) => (_xmlXPathFreeContext = Module._xmlXPathFreeContext = wasmExports.xmlXPathFreeContext)(e), _xmlFreeDoc = Module._xmlFreeDoc = (e) => (_xmlFreeDoc = Module._xmlFreeDoc = wasmExports.xmlFreeDoc)(e), _xmlXPathCtxtCompile = Module._xmlXPathCtxtCompile = (e, t2) => (_xmlXPathCtxtCompile = Module._xmlXPathCtxtCompile = wasmExports.xmlXPathCtxtCompile)(e, t2), _xmlXPathCompiledEval = Module._xmlXPathCompiledEval = (e, t2) => (_xmlXPathCompiledEval = Module._xmlXPathCompiledEval = wasmExports.xmlXPathCompiledEval)(e, t2), _xmlXPathFreeCompExpr = Module._xmlXPathFreeCompExpr = (e) => (_xmlXPathFreeCompExpr = Module._xmlXPathFreeCompExpr = wasmExports.xmlXPathFreeCompExpr)(e), _pg_do_encoding_conversion = Module._pg_do_encoding_conversion = (e, t2, r, a2) => (_pg_do_encoding_conversion = Module._pg_do_encoding_conversion = wasmExports.pg_do_encoding_conversion)(e, t2, r, a2), _xmlStrdup = Module._xmlStrdup = (e) => (_xmlStrdup = Module._xmlStrdup = wasmExports.xmlStrdup)(e), _xmlXPathCastNodeToString = Module._xmlXPathCastNodeToString = (e) => (_xmlXPathCastNodeToString = Module._xmlXPathCastNodeToString = wasmExports.xmlXPathCastNodeToString)(e), _get_typsubscript = Module._get_typsubscript = (e, t2) => (_get_typsubscript = Module._get_typsubscript = wasmExports.get_typsubscript)(e, t2), _CachedPlanAllowsSimpleValidityCheck = Module._CachedPlanAllowsSimpleValidityCheck = (e, t2, r) => (_CachedPlanAllowsSimpleValidityCheck = Module._CachedPlanAllowsSimpleValidityCheck = wasmExports.CachedPlanAllowsSimpleValidityCheck)(e, t2, r), _CachedPlanIsSimplyValid = Module._CachedPlanIsSimplyValid = (e, t2, r) => (_CachedPlanIsSimplyValid = Module._CachedPlanIsSimplyValid = wasmExports.CachedPlanIsSimplyValid)(e, t2, r), _GetCachedExpression = Module._GetCachedExpression = (e) => (_GetCachedExpression = Module._GetCachedExpression = wasmExports.GetCachedExpression)(e), _FreeCachedExpression = Module._FreeCachedExpression = (e) => (_FreeCachedExpression = Module._FreeCachedExpression = wasmExports.FreeCachedExpression)(e), _ReleaseAllPlanCacheRefsInOwner = Module._ReleaseAllPlanCacheRefsInOwner = (e) => (_ReleaseAllPlanCacheRefsInOwner = Module._ReleaseAllPlanCacheRefsInOwner = wasmExports.ReleaseAllPlanCacheRefsInOwner)(e), _in_error_recursion_trouble = Module._in_error_recursion_trouble = () => (_in_error_recursion_trouble = Module._in_error_recursion_trouble = wasmExports.in_error_recursion_trouble)(), _openlog = Module._openlog = (e, t2, r) => (_openlog = Module._openlog = wasmExports.openlog)(e, t2, r), _syslog = Module._syslog = (e, t2, r) => (_syslog = Module._syslog = wasmExports.syslog)(e, t2, r), _GetErrorContextStack = Module._GetErrorContextStack = () => (_GetErrorContextStack = Module._GetErrorContextStack = wasmExports.GetErrorContextStack)(), _closelog = Module._closelog = () => (_closelog = Module._closelog = wasmExports.closelog)(), _dlsym = Module._dlsym = (e, t2) => (_dlsym = Module._dlsym = wasmExports.dlsym)(e, t2), _dlopen = Module._dlopen = (e, t2) => (_dlopen = Module._dlopen = wasmExports.dlopen)(e, t2), _dlerror = Module._dlerror = () => (_dlerror = Module._dlerror = wasmExports.dlerror)(), _dlclose = Module._dlclose = (e) => (_dlclose = Module._dlclose = wasmExports.dlclose)(e), _find_rendezvous_variable = Module._find_rendezvous_variable = (e) => (_find_rendezvous_variable = Module._find_rendezvous_variable = wasmExports.find_rendezvous_variable)(e), _CallerFInfoFunctionCall2 = Module._CallerFInfoFunctionCall2 = (e, t2, r, a2, o4) => (_CallerFInfoFunctionCall2 = Module._CallerFInfoFunctionCall2 = wasmExports.CallerFInfoFunctionCall2)(e, t2, r, a2, o4), _FunctionCall0Coll = Module._FunctionCall0Coll = (e, t2) => (_FunctionCall0Coll = Module._FunctionCall0Coll = wasmExports.FunctionCall0Coll)(e, t2), _resolve_polymorphic_argtypes = Module._resolve_polymorphic_argtypes = (e, t2, r, a2) => (_resolve_polymorphic_argtypes = Module._resolve_polymorphic_argtypes = wasmExports.resolve_polymorphic_argtypes)(e, t2, r, a2), _memcpy = Module._memcpy = (e, t2, r) => (_memcpy = Module._memcpy = wasmExports.memcpy)(e, t2, r), _pg_bindtextdomain = Module._pg_bindtextdomain = (e) => (_pg_bindtextdomain = Module._pg_bindtextdomain = wasmExports.pg_bindtextdomain)(e), _local2local = Module._local2local = (e, t2, r, a2, o4, s4, l3) => (_local2local = Module._local2local = wasmExports.local2local)(e, t2, r, a2, o4, s4, l3), _report_untranslatable_char = Module._report_untranslatable_char = (e, t2, r, a2) => (_report_untranslatable_char = Module._report_untranslatable_char = wasmExports.report_untranslatable_char)(e, t2, r, a2), _latin2mic = Module._latin2mic = (e, t2, r, a2, o4, s4) => (_latin2mic = Module._latin2mic = wasmExports.latin2mic)(e, t2, r, a2, o4, s4), _mic2latin = Module._mic2latin = (e, t2, r, a2, o4, s4) => (_mic2latin = Module._mic2latin = wasmExports.mic2latin)(e, t2, r, a2, o4, s4), _latin2mic_with_table = Module._latin2mic_with_table = (e, t2, r, a2, o4, s4, l3) => (_latin2mic_with_table = Module._latin2mic_with_table = wasmExports.latin2mic_with_table)(e, t2, r, a2, o4, s4, l3), _mic2latin_with_table = Module._mic2latin_with_table = (e, t2, r, a2, o4, s4, l3) => (_mic2latin_with_table = Module._mic2latin_with_table = wasmExports.mic2latin_with_table)(e, t2, r, a2, o4, s4, l3), _UtfToLocal = Module._UtfToLocal = (e, t2, r, a2, o4, s4, l3, _3, n3) => (_UtfToLocal = Module._UtfToLocal = wasmExports.UtfToLocal)(e, t2, r, a2, o4, s4, l3, _3, n3), _LocalToUtf = Module._LocalToUtf = (e, t2, r, a2, o4, s4, l3, _3, n3) => (_LocalToUtf = Module._LocalToUtf = wasmExports.LocalToUtf)(e, t2, r, a2, o4, s4, l3, _3, n3), _check_encoding_conversion_args = Module._check_encoding_conversion_args = (e, t2, r, a2, o4) => (_check_encoding_conversion_args = Module._check_encoding_conversion_args = wasmExports.check_encoding_conversion_args)(e, t2, r, a2, o4), _DefineCustomBoolVariable = Module._DefineCustomBoolVariable = (e, t2, r, a2, o4, s4, l3, _3, n3, m5) => (_DefineCustomBoolVariable = Module._DefineCustomBoolVariable = wasmExports.DefineCustomBoolVariable)(e, t2, r, a2, o4, s4, l3, _3, n3, m5), _DefineCustomIntVariable = Module._DefineCustomIntVariable = (e, t2, r, a2, o4, s4, l3, _3, n3, m5, p4, d3) => (_DefineCustomIntVariable = Module._DefineCustomIntVariable = wasmExports.DefineCustomIntVariable)(e, t2, r, a2, o4, s4, l3, _3, n3, m5, p4, d3), _DefineCustomRealVariable = Module._DefineCustomRealVariable = (e, t2, r, a2, o4, s4, l3, _3, n3, m5, p4, d3) => (_DefineCustomRealVariable = Module._DefineCustomRealVariable = wasmExports.DefineCustomRealVariable)(e, t2, r, a2, o4, s4, l3, _3, n3, m5, p4, d3), _DefineCustomStringVariable = Module._DefineCustomStringVariable = (e, t2, r, a2, o4, s4, l3, _3, n3, m5) => (_DefineCustomStringVariable = Module._DefineCustomStringVariable = wasmExports.DefineCustomStringVariable)(e, t2, r, a2, o4, s4, l3, _3, n3, m5), _DefineCustomEnumVariable = Module._DefineCustomEnumVariable = (e, t2, r, a2, o4, s4, l3, _3, n3, m5, p4) => (_DefineCustomEnumVariable = Module._DefineCustomEnumVariable = wasmExports.DefineCustomEnumVariable)(e, t2, r, a2, o4, s4, l3, _3, n3, m5, p4), _MarkGUCPrefixReserved = Module._MarkGUCPrefixReserved = (e) => (_MarkGUCPrefixReserved = Module._MarkGUCPrefixReserved = wasmExports.MarkGUCPrefixReserved)(e), _sampler_random_init_state = Module._sampler_random_init_state = (e, t2) => (_sampler_random_init_state = Module._sampler_random_init_state = wasmExports.sampler_random_init_state)(e, t2), _pchomp = Module._pchomp = (e) => (_pchomp = Module._pchomp = wasmExports.pchomp)(e), _PinPortal = Module._PinPortal = (e) => (_PinPortal = Module._PinPortal = wasmExports.PinPortal)(e), _UnpinPortal = Module._UnpinPortal = (e) => (_UnpinPortal = Module._UnpinPortal = wasmExports.UnpinPortal)(e), _isolat1ToUTF8 = Module._isolat1ToUTF8 = (e, t2, r, a2) => (_isolat1ToUTF8 = Module._isolat1ToUTF8 = wasmExports.isolat1ToUTF8)(e, t2, r, a2), _UTF8Toisolat1 = Module._UTF8Toisolat1 = (e, t2, r, a2) => (_UTF8Toisolat1 = Module._UTF8Toisolat1 = wasmExports.UTF8Toisolat1)(e, t2, r, a2), _vfprintf = Module._vfprintf = (e, t2, r) => (_vfprintf = Module._vfprintf = wasmExports.vfprintf)(e, t2, r), _vsnprintf = Module._vsnprintf = (e, t2, r, a2) => (_vsnprintf = Module._vsnprintf = wasmExports.vsnprintf)(e, t2, r, a2), _xmlParserValidityWarning = Module._xmlParserValidityWarning = (e, t2, r) => (_xmlParserValidityWarning = Module._xmlParserValidityWarning = wasmExports.xmlParserValidityWarning)(e, t2, r), _xmlParserValidityError = Module._xmlParserValidityError = (e, t2, r) => (_xmlParserValidityError = Module._xmlParserValidityError = wasmExports.xmlParserValidityError)(e, t2, r), _xmlParserError = Module._xmlParserError = (e, t2, r) => (_xmlParserError = Module._xmlParserError = wasmExports.xmlParserError)(e, t2, r), _xmlParserWarning = Module._xmlParserWarning = (e, t2, r) => (_xmlParserWarning = Module._xmlParserWarning = wasmExports.xmlParserWarning)(e, t2, r), _fprintf = Module._fprintf = (e, t2, r) => (_fprintf = Module._fprintf = wasmExports.fprintf)(e, t2, r), ___xmlParserInputBufferCreateFilename = Module.___xmlParserInputBufferCreateFilename = (e, t2) => (___xmlParserInputBufferCreateFilename = Module.___xmlParserInputBufferCreateFilename = wasmExports.__xmlParserInputBufferCreateFilename)(e, t2), ___xmlOutputBufferCreateFilename = Module.___xmlOutputBufferCreateFilename = (e, t2, r) => (___xmlOutputBufferCreateFilename = Module.___xmlOutputBufferCreateFilename = wasmExports.__xmlOutputBufferCreateFilename)(e, t2, r), _xmlSAX2InternalSubset = Module._xmlSAX2InternalSubset = (e, t2, r, a2) => (_xmlSAX2InternalSubset = Module._xmlSAX2InternalSubset = wasmExports.xmlSAX2InternalSubset)(e, t2, r, a2), _xmlSAX2IsStandalone = Module._xmlSAX2IsStandalone = (e) => (_xmlSAX2IsStandalone = Module._xmlSAX2IsStandalone = wasmExports.xmlSAX2IsStandalone)(e), _xmlSAX2HasInternalSubset = Module._xmlSAX2HasInternalSubset = (e) => (_xmlSAX2HasInternalSubset = Module._xmlSAX2HasInternalSubset = wasmExports.xmlSAX2HasInternalSubset)(e), _xmlSAX2HasExternalSubset = Module._xmlSAX2HasExternalSubset = (e) => (_xmlSAX2HasExternalSubset = Module._xmlSAX2HasExternalSubset = wasmExports.xmlSAX2HasExternalSubset)(e), _xmlSAX2ResolveEntity = Module._xmlSAX2ResolveEntity = (e, t2, r) => (_xmlSAX2ResolveEntity = Module._xmlSAX2ResolveEntity = wasmExports.xmlSAX2ResolveEntity)(e, t2, r), _xmlSAX2GetEntity = Module._xmlSAX2GetEntity = (e, t2) => (_xmlSAX2GetEntity = Module._xmlSAX2GetEntity = wasmExports.xmlSAX2GetEntity)(e, t2), _xmlSAX2EntityDecl = Module._xmlSAX2EntityDecl = (e, t2, r, a2, o4, s4) => (_xmlSAX2EntityDecl = Module._xmlSAX2EntityDecl = wasmExports.xmlSAX2EntityDecl)(e, t2, r, a2, o4, s4), _xmlSAX2NotationDecl = Module._xmlSAX2NotationDecl = (e, t2, r, a2) => (_xmlSAX2NotationDecl = Module._xmlSAX2NotationDecl = wasmExports.xmlSAX2NotationDecl)(e, t2, r, a2), _xmlSAX2AttributeDecl = Module._xmlSAX2AttributeDecl = (e, t2, r, a2, o4, s4, l3) => (_xmlSAX2AttributeDecl = Module._xmlSAX2AttributeDecl = wasmExports.xmlSAX2AttributeDecl)(e, t2, r, a2, o4, s4, l3), _xmlSAX2ElementDecl = Module._xmlSAX2ElementDecl = (e, t2, r, a2) => (_xmlSAX2ElementDecl = Module._xmlSAX2ElementDecl = wasmExports.xmlSAX2ElementDecl)(e, t2, r, a2), _xmlSAX2UnparsedEntityDecl = Module._xmlSAX2UnparsedEntityDecl = (e, t2, r, a2, o4) => (_xmlSAX2UnparsedEntityDecl = Module._xmlSAX2UnparsedEntityDecl = wasmExports.xmlSAX2UnparsedEntityDecl)(e, t2, r, a2, o4), _xmlSAX2SetDocumentLocator = Module._xmlSAX2SetDocumentLocator = (e, t2) => (_xmlSAX2SetDocumentLocator = Module._xmlSAX2SetDocumentLocator = wasmExports.xmlSAX2SetDocumentLocator)(e, t2), _xmlSAX2StartDocument = Module._xmlSAX2StartDocument = (e) => (_xmlSAX2StartDocument = Module._xmlSAX2StartDocument = wasmExports.xmlSAX2StartDocument)(e), _xmlSAX2EndDocument = Module._xmlSAX2EndDocument = (e) => (_xmlSAX2EndDocument = Module._xmlSAX2EndDocument = wasmExports.xmlSAX2EndDocument)(e), _xmlSAX2StartElement = Module._xmlSAX2StartElement = (e, t2, r) => (_xmlSAX2StartElement = Module._xmlSAX2StartElement = wasmExports.xmlSAX2StartElement)(e, t2, r), _xmlSAX2EndElement = Module._xmlSAX2EndElement = (e, t2) => (_xmlSAX2EndElement = Module._xmlSAX2EndElement = wasmExports.xmlSAX2EndElement)(e, t2), _xmlSAX2Reference = Module._xmlSAX2Reference = (e, t2) => (_xmlSAX2Reference = Module._xmlSAX2Reference = wasmExports.xmlSAX2Reference)(e, t2), _xmlSAX2Characters = Module._xmlSAX2Characters = (e, t2, r) => (_xmlSAX2Characters = Module._xmlSAX2Characters = wasmExports.xmlSAX2Characters)(e, t2, r), _xmlSAX2ProcessingInstruction = Module._xmlSAX2ProcessingInstruction = (e, t2, r) => (_xmlSAX2ProcessingInstruction = Module._xmlSAX2ProcessingInstruction = wasmExports.xmlSAX2ProcessingInstruction)(e, t2, r), _xmlSAX2Comment = Module._xmlSAX2Comment = (e, t2) => (_xmlSAX2Comment = Module._xmlSAX2Comment = wasmExports.xmlSAX2Comment)(e, t2), _xmlSAX2GetParameterEntity = Module._xmlSAX2GetParameterEntity = (e, t2) => (_xmlSAX2GetParameterEntity = Module._xmlSAX2GetParameterEntity = wasmExports.xmlSAX2GetParameterEntity)(e, t2), _xmlSAX2CDataBlock = Module._xmlSAX2CDataBlock = (e, t2, r) => (_xmlSAX2CDataBlock = Module._xmlSAX2CDataBlock = wasmExports.xmlSAX2CDataBlock)(e, t2, r), _xmlSAX2ExternalSubset = Module._xmlSAX2ExternalSubset = (e, t2, r, a2) => (_xmlSAX2ExternalSubset = Module._xmlSAX2ExternalSubset = wasmExports.xmlSAX2ExternalSubset)(e, t2, r, a2), _xmlSAX2GetPublicId = Module._xmlSAX2GetPublicId = (e) => (_xmlSAX2GetPublicId = Module._xmlSAX2GetPublicId = wasmExports.xmlSAX2GetPublicId)(e), _xmlSAX2GetSystemId = Module._xmlSAX2GetSystemId = (e) => (_xmlSAX2GetSystemId = Module._xmlSAX2GetSystemId = wasmExports.xmlSAX2GetSystemId)(e), _xmlSAX2GetLineNumber = Module._xmlSAX2GetLineNumber = (e) => (_xmlSAX2GetLineNumber = Module._xmlSAX2GetLineNumber = wasmExports.xmlSAX2GetLineNumber)(e), _xmlSAX2GetColumnNumber = Module._xmlSAX2GetColumnNumber = (e) => (_xmlSAX2GetColumnNumber = Module._xmlSAX2GetColumnNumber = wasmExports.xmlSAX2GetColumnNumber)(e), _xmlSAX2IgnorableWhitespace = Module._xmlSAX2IgnorableWhitespace = (e, t2, r) => (_xmlSAX2IgnorableWhitespace = Module._xmlSAX2IgnorableWhitespace = wasmExports.xmlSAX2IgnorableWhitespace)(e, t2, r), _xmlHashDefaultDeallocator = Module._xmlHashDefaultDeallocator = (e, t2) => (_xmlHashDefaultDeallocator = Module._xmlHashDefaultDeallocator = wasmExports.xmlHashDefaultDeallocator)(e, t2), _iconv_open = Module._iconv_open = (e, t2) => (_iconv_open = Module._iconv_open = wasmExports.iconv_open)(e, t2), _iconv_close = Module._iconv_close = (e) => (_iconv_close = Module._iconv_close = wasmExports.iconv_close)(e), _iconv = Module._iconv = (e, t2, r, a2, o4) => (_iconv = Module._iconv = wasmExports.iconv)(e, t2, r, a2, o4), _UTF8ToHtml = Module._UTF8ToHtml = (e, t2, r, a2) => (_UTF8ToHtml = Module._UTF8ToHtml = wasmExports.UTF8ToHtml)(e, t2, r, a2), _xmlReadMemory = Module._xmlReadMemory = (e, t2, r, a2, o4) => (_xmlReadMemory = Module._xmlReadMemory = wasmExports.xmlReadMemory)(e, t2, r, a2, o4), _xmlSAX2StartElementNs = Module._xmlSAX2StartElementNs = (e, t2, r, a2, o4, s4, l3, _3, n3) => (_xmlSAX2StartElementNs = Module._xmlSAX2StartElementNs = wasmExports.xmlSAX2StartElementNs)(e, t2, r, a2, o4, s4, l3, _3, n3), _xmlSAX2EndElementNs = Module._xmlSAX2EndElementNs = (e, t2, r, a2) => (_xmlSAX2EndElementNs = Module._xmlSAX2EndElementNs = wasmExports.xmlSAX2EndElementNs)(e, t2, r, a2), ___cxa_atexit = Module.___cxa_atexit = (e, t2, r) => (___cxa_atexit = Module.___cxa_atexit = wasmExports.__cxa_atexit)(e, t2, r), _xmlDocGetRootElement = Module._xmlDocGetRootElement = (e) => (_xmlDocGetRootElement = Module._xmlDocGetRootElement = wasmExports.xmlDocGetRootElement)(e), _xmlFileMatch = Module._xmlFileMatch = (e) => (_xmlFileMatch = Module._xmlFileMatch = wasmExports.xmlFileMatch)(e), _xmlFileOpen = Module._xmlFileOpen = (e) => (_xmlFileOpen = Module._xmlFileOpen = wasmExports.xmlFileOpen)(e), _xmlFileRead = Module._xmlFileRead = (e, t2, r) => (_xmlFileRead = Module._xmlFileRead = wasmExports.xmlFileRead)(e, t2, r), _xmlFileClose = Module._xmlFileClose = (e) => (_xmlFileClose = Module._xmlFileClose = wasmExports.xmlFileClose)(e), _gzread = Module._gzread = (e, t2, r) => (_gzread = Module._gzread = wasmExports.gzread)(e, t2, r), _gzclose = Module._gzclose = (e) => (_gzclose = Module._gzclose = wasmExports.gzclose)(e), _gzdirect = Module._gzdirect = (e) => (_gzdirect = Module._gzdirect = wasmExports.gzdirect)(e), _gzdopen = Module._gzdopen = (e, t2) => (_gzdopen = Module._gzdopen = wasmExports.gzdopen)(e, t2), _gzopen = Module._gzopen = (e, t2) => (_gzopen = Module._gzopen = wasmExports.gzopen)(e, t2), _gzwrite = Module._gzwrite = (e, t2, r) => (_gzwrite = Module._gzwrite = wasmExports.gzwrite)(e, t2, r), _xmlUCSIsCatNd = Module._xmlUCSIsCatNd = (e) => (_xmlUCSIsCatNd = Module._xmlUCSIsCatNd = wasmExports.xmlUCSIsCatNd)(e), _xmlUCSIsCatP = Module._xmlUCSIsCatP = (e) => (_xmlUCSIsCatP = Module._xmlUCSIsCatP = wasmExports.xmlUCSIsCatP)(e), _xmlUCSIsCatZ = Module._xmlUCSIsCatZ = (e) => (_xmlUCSIsCatZ = Module._xmlUCSIsCatZ = wasmExports.xmlUCSIsCatZ)(e), _xmlUCSIsCatC = Module._xmlUCSIsCatC = (e) => (_xmlUCSIsCatC = Module._xmlUCSIsCatC = wasmExports.xmlUCSIsCatC)(e), _xmlUCSIsCatL = Module._xmlUCSIsCatL = (e) => (_xmlUCSIsCatL = Module._xmlUCSIsCatL = wasmExports.xmlUCSIsCatL)(e), _xmlUCSIsCatLu = Module._xmlUCSIsCatLu = (e) => (_xmlUCSIsCatLu = Module._xmlUCSIsCatLu = wasmExports.xmlUCSIsCatLu)(e), _xmlUCSIsCatLl = Module._xmlUCSIsCatLl = (e) => (_xmlUCSIsCatLl = Module._xmlUCSIsCatLl = wasmExports.xmlUCSIsCatLl)(e), _xmlUCSIsCatLt = Module._xmlUCSIsCatLt = (e) => (_xmlUCSIsCatLt = Module._xmlUCSIsCatLt = wasmExports.xmlUCSIsCatLt)(e), _xmlUCSIsCatLm = Module._xmlUCSIsCatLm = (e) => (_xmlUCSIsCatLm = Module._xmlUCSIsCatLm = wasmExports.xmlUCSIsCatLm)(e), _xmlUCSIsCatLo = Module._xmlUCSIsCatLo = (e) => (_xmlUCSIsCatLo = Module._xmlUCSIsCatLo = wasmExports.xmlUCSIsCatLo)(e), _xmlUCSIsCatM = Module._xmlUCSIsCatM = (e) => (_xmlUCSIsCatM = Module._xmlUCSIsCatM = wasmExports.xmlUCSIsCatM)(e), _xmlUCSIsCatMn = Module._xmlUCSIsCatMn = (e) => (_xmlUCSIsCatMn = Module._xmlUCSIsCatMn = wasmExports.xmlUCSIsCatMn)(e), _xmlUCSIsCatMc = Module._xmlUCSIsCatMc = (e) => (_xmlUCSIsCatMc = Module._xmlUCSIsCatMc = wasmExports.xmlUCSIsCatMc)(e), _xmlUCSIsCatMe = Module._xmlUCSIsCatMe = (e) => (_xmlUCSIsCatMe = Module._xmlUCSIsCatMe = wasmExports.xmlUCSIsCatMe)(e), _xmlUCSIsCatN = Module._xmlUCSIsCatN = (e) => (_xmlUCSIsCatN = Module._xmlUCSIsCatN = wasmExports.xmlUCSIsCatN)(e), _xmlUCSIsCatNl = Module._xmlUCSIsCatNl = (e) => (_xmlUCSIsCatNl = Module._xmlUCSIsCatNl = wasmExports.xmlUCSIsCatNl)(e), _xmlUCSIsCatNo = Module._xmlUCSIsCatNo = (e) => (_xmlUCSIsCatNo = Module._xmlUCSIsCatNo = wasmExports.xmlUCSIsCatNo)(e), _xmlUCSIsCatPc = Module._xmlUCSIsCatPc = (e) => (_xmlUCSIsCatPc = Module._xmlUCSIsCatPc = wasmExports.xmlUCSIsCatPc)(e), _xmlUCSIsCatPd = Module._xmlUCSIsCatPd = (e) => (_xmlUCSIsCatPd = Module._xmlUCSIsCatPd = wasmExports.xmlUCSIsCatPd)(e), _xmlUCSIsCatPs = Module._xmlUCSIsCatPs = (e) => (_xmlUCSIsCatPs = Module._xmlUCSIsCatPs = wasmExports.xmlUCSIsCatPs)(e), _xmlUCSIsCatPe = Module._xmlUCSIsCatPe = (e) => (_xmlUCSIsCatPe = Module._xmlUCSIsCatPe = wasmExports.xmlUCSIsCatPe)(e), _xmlUCSIsCatPi = Module._xmlUCSIsCatPi = (e) => (_xmlUCSIsCatPi = Module._xmlUCSIsCatPi = wasmExports.xmlUCSIsCatPi)(e), _xmlUCSIsCatPf = Module._xmlUCSIsCatPf = (e) => (_xmlUCSIsCatPf = Module._xmlUCSIsCatPf = wasmExports.xmlUCSIsCatPf)(e), _xmlUCSIsCatPo = Module._xmlUCSIsCatPo = (e) => (_xmlUCSIsCatPo = Module._xmlUCSIsCatPo = wasmExports.xmlUCSIsCatPo)(e), _xmlUCSIsCatZs = Module._xmlUCSIsCatZs = (e) => (_xmlUCSIsCatZs = Module._xmlUCSIsCatZs = wasmExports.xmlUCSIsCatZs)(e), _xmlUCSIsCatZl = Module._xmlUCSIsCatZl = (e) => (_xmlUCSIsCatZl = Module._xmlUCSIsCatZl = wasmExports.xmlUCSIsCatZl)(e), _xmlUCSIsCatZp = Module._xmlUCSIsCatZp = (e) => (_xmlUCSIsCatZp = Module._xmlUCSIsCatZp = wasmExports.xmlUCSIsCatZp)(e), _xmlUCSIsCatS = Module._xmlUCSIsCatS = (e) => (_xmlUCSIsCatS = Module._xmlUCSIsCatS = wasmExports.xmlUCSIsCatS)(e), _xmlUCSIsCatSm = Module._xmlUCSIsCatSm = (e) => (_xmlUCSIsCatSm = Module._xmlUCSIsCatSm = wasmExports.xmlUCSIsCatSm)(e), _xmlUCSIsCatSc = Module._xmlUCSIsCatSc = (e) => (_xmlUCSIsCatSc = Module._xmlUCSIsCatSc = wasmExports.xmlUCSIsCatSc)(e), _xmlUCSIsCatSk = Module._xmlUCSIsCatSk = (e) => (_xmlUCSIsCatSk = Module._xmlUCSIsCatSk = wasmExports.xmlUCSIsCatSk)(e), _xmlUCSIsCatSo = Module._xmlUCSIsCatSo = (e) => (_xmlUCSIsCatSo = Module._xmlUCSIsCatSo = wasmExports.xmlUCSIsCatSo)(e), _xmlUCSIsCatCc = Module._xmlUCSIsCatCc = (e) => (_xmlUCSIsCatCc = Module._xmlUCSIsCatCc = wasmExports.xmlUCSIsCatCc)(e), _xmlUCSIsCatCf = Module._xmlUCSIsCatCf = (e) => (_xmlUCSIsCatCf = Module._xmlUCSIsCatCf = wasmExports.xmlUCSIsCatCf)(e), _xmlUCSIsCatCo = Module._xmlUCSIsCatCo = (e) => (_xmlUCSIsCatCo = Module._xmlUCSIsCatCo = wasmExports.xmlUCSIsCatCo)(e), _xmlUCSIsAegeanNumbers = Module._xmlUCSIsAegeanNumbers = (e) => (_xmlUCSIsAegeanNumbers = Module._xmlUCSIsAegeanNumbers = wasmExports.xmlUCSIsAegeanNumbers)(e), _xmlUCSIsAlphabeticPresentationForms = Module._xmlUCSIsAlphabeticPresentationForms = (e) => (_xmlUCSIsAlphabeticPresentationForms = Module._xmlUCSIsAlphabeticPresentationForms = wasmExports.xmlUCSIsAlphabeticPresentationForms)(e), _xmlUCSIsArabic = Module._xmlUCSIsArabic = (e) => (_xmlUCSIsArabic = Module._xmlUCSIsArabic = wasmExports.xmlUCSIsArabic)(e), _xmlUCSIsArabicPresentationFormsA = Module._xmlUCSIsArabicPresentationFormsA = (e) => (_xmlUCSIsArabicPresentationFormsA = Module._xmlUCSIsArabicPresentationFormsA = wasmExports.xmlUCSIsArabicPresentationFormsA)(e), _xmlUCSIsArabicPresentationFormsB = Module._xmlUCSIsArabicPresentationFormsB = (e) => (_xmlUCSIsArabicPresentationFormsB = Module._xmlUCSIsArabicPresentationFormsB = wasmExports.xmlUCSIsArabicPresentationFormsB)(e), _xmlUCSIsArmenian = Module._xmlUCSIsArmenian = (e) => (_xmlUCSIsArmenian = Module._xmlUCSIsArmenian = wasmExports.xmlUCSIsArmenian)(e), _xmlUCSIsArrows = Module._xmlUCSIsArrows = (e) => (_xmlUCSIsArrows = Module._xmlUCSIsArrows = wasmExports.xmlUCSIsArrows)(e), _xmlUCSIsBasicLatin = Module._xmlUCSIsBasicLatin = (e) => (_xmlUCSIsBasicLatin = Module._xmlUCSIsBasicLatin = wasmExports.xmlUCSIsBasicLatin)(e), _xmlUCSIsBengali = Module._xmlUCSIsBengali = (e) => (_xmlUCSIsBengali = Module._xmlUCSIsBengali = wasmExports.xmlUCSIsBengali)(e), _xmlUCSIsBlockElements = Module._xmlUCSIsBlockElements = (e) => (_xmlUCSIsBlockElements = Module._xmlUCSIsBlockElements = wasmExports.xmlUCSIsBlockElements)(e), _xmlUCSIsBopomofo = Module._xmlUCSIsBopomofo = (e) => (_xmlUCSIsBopomofo = Module._xmlUCSIsBopomofo = wasmExports.xmlUCSIsBopomofo)(e), _xmlUCSIsBopomofoExtended = Module._xmlUCSIsBopomofoExtended = (e) => (_xmlUCSIsBopomofoExtended = Module._xmlUCSIsBopomofoExtended = wasmExports.xmlUCSIsBopomofoExtended)(e), _xmlUCSIsBoxDrawing = Module._xmlUCSIsBoxDrawing = (e) => (_xmlUCSIsBoxDrawing = Module._xmlUCSIsBoxDrawing = wasmExports.xmlUCSIsBoxDrawing)(e), _xmlUCSIsBraillePatterns = Module._xmlUCSIsBraillePatterns = (e) => (_xmlUCSIsBraillePatterns = Module._xmlUCSIsBraillePatterns = wasmExports.xmlUCSIsBraillePatterns)(e), _xmlUCSIsBuhid = Module._xmlUCSIsBuhid = (e) => (_xmlUCSIsBuhid = Module._xmlUCSIsBuhid = wasmExports.xmlUCSIsBuhid)(e), _xmlUCSIsByzantineMusicalSymbols = Module._xmlUCSIsByzantineMusicalSymbols = (e) => (_xmlUCSIsByzantineMusicalSymbols = Module._xmlUCSIsByzantineMusicalSymbols = wasmExports.xmlUCSIsByzantineMusicalSymbols)(e), _xmlUCSIsCJKCompatibility = Module._xmlUCSIsCJKCompatibility = (e) => (_xmlUCSIsCJKCompatibility = Module._xmlUCSIsCJKCompatibility = wasmExports.xmlUCSIsCJKCompatibility)(e), _xmlUCSIsCJKCompatibilityForms = Module._xmlUCSIsCJKCompatibilityForms = (e) => (_xmlUCSIsCJKCompatibilityForms = Module._xmlUCSIsCJKCompatibilityForms = wasmExports.xmlUCSIsCJKCompatibilityForms)(e), _xmlUCSIsCJKCompatibilityIdeographs = Module._xmlUCSIsCJKCompatibilityIdeographs = (e) => (_xmlUCSIsCJKCompatibilityIdeographs = Module._xmlUCSIsCJKCompatibilityIdeographs = wasmExports.xmlUCSIsCJKCompatibilityIdeographs)(e), _xmlUCSIsCJKCompatibilityIdeographsSupplement = Module._xmlUCSIsCJKCompatibilityIdeographsSupplement = (e) => (_xmlUCSIsCJKCompatibilityIdeographsSupplement = Module._xmlUCSIsCJKCompatibilityIdeographsSupplement = wasmExports.xmlUCSIsCJKCompatibilityIdeographsSupplement)(e), _xmlUCSIsCJKRadicalsSupplement = Module._xmlUCSIsCJKRadicalsSupplement = (e) => (_xmlUCSIsCJKRadicalsSupplement = Module._xmlUCSIsCJKRadicalsSupplement = wasmExports.xmlUCSIsCJKRadicalsSupplement)(e), _xmlUCSIsCJKSymbolsandPunctuation = Module._xmlUCSIsCJKSymbolsandPunctuation = (e) => (_xmlUCSIsCJKSymbolsandPunctuation = Module._xmlUCSIsCJKSymbolsandPunctuation = wasmExports.xmlUCSIsCJKSymbolsandPunctuation)(e), _xmlUCSIsCJKUnifiedIdeographs = Module._xmlUCSIsCJKUnifiedIdeographs = (e) => (_xmlUCSIsCJKUnifiedIdeographs = Module._xmlUCSIsCJKUnifiedIdeographs = wasmExports.xmlUCSIsCJKUnifiedIdeographs)(e), _xmlUCSIsCJKUnifiedIdeographsExtensionA = Module._xmlUCSIsCJKUnifiedIdeographsExtensionA = (e) => (_xmlUCSIsCJKUnifiedIdeographsExtensionA = Module._xmlUCSIsCJKUnifiedIdeographsExtensionA = wasmExports.xmlUCSIsCJKUnifiedIdeographsExtensionA)(e), _xmlUCSIsCJKUnifiedIdeographsExtensionB = Module._xmlUCSIsCJKUnifiedIdeographsExtensionB = (e) => (_xmlUCSIsCJKUnifiedIdeographsExtensionB = Module._xmlUCSIsCJKUnifiedIdeographsExtensionB = wasmExports.xmlUCSIsCJKUnifiedIdeographsExtensionB)(e), _xmlUCSIsCherokee = Module._xmlUCSIsCherokee = (e) => (_xmlUCSIsCherokee = Module._xmlUCSIsCherokee = wasmExports.xmlUCSIsCherokee)(e), _xmlUCSIsCombiningDiacriticalMarks = Module._xmlUCSIsCombiningDiacriticalMarks = (e) => (_xmlUCSIsCombiningDiacriticalMarks = Module._xmlUCSIsCombiningDiacriticalMarks = wasmExports.xmlUCSIsCombiningDiacriticalMarks)(e), _xmlUCSIsCombiningDiacriticalMarksforSymbols = Module._xmlUCSIsCombiningDiacriticalMarksforSymbols = (e) => (_xmlUCSIsCombiningDiacriticalMarksforSymbols = Module._xmlUCSIsCombiningDiacriticalMarksforSymbols = wasmExports.xmlUCSIsCombiningDiacriticalMarksforSymbols)(e), _xmlUCSIsCombiningHalfMarks = Module._xmlUCSIsCombiningHalfMarks = (e) => (_xmlUCSIsCombiningHalfMarks = Module._xmlUCSIsCombiningHalfMarks = wasmExports.xmlUCSIsCombiningHalfMarks)(e), _xmlUCSIsCombiningMarksforSymbols = Module._xmlUCSIsCombiningMarksforSymbols = (e) => (_xmlUCSIsCombiningMarksforSymbols = Module._xmlUCSIsCombiningMarksforSymbols = wasmExports.xmlUCSIsCombiningMarksforSymbols)(e), _xmlUCSIsControlPictures = Module._xmlUCSIsControlPictures = (e) => (_xmlUCSIsControlPictures = Module._xmlUCSIsControlPictures = wasmExports.xmlUCSIsControlPictures)(e), _xmlUCSIsCurrencySymbols = Module._xmlUCSIsCurrencySymbols = (e) => (_xmlUCSIsCurrencySymbols = Module._xmlUCSIsCurrencySymbols = wasmExports.xmlUCSIsCurrencySymbols)(e), _xmlUCSIsCypriotSyllabary = Module._xmlUCSIsCypriotSyllabary = (e) => (_xmlUCSIsCypriotSyllabary = Module._xmlUCSIsCypriotSyllabary = wasmExports.xmlUCSIsCypriotSyllabary)(e), _xmlUCSIsCyrillic = Module._xmlUCSIsCyrillic = (e) => (_xmlUCSIsCyrillic = Module._xmlUCSIsCyrillic = wasmExports.xmlUCSIsCyrillic)(e), _xmlUCSIsCyrillicSupplement = Module._xmlUCSIsCyrillicSupplement = (e) => (_xmlUCSIsCyrillicSupplement = Module._xmlUCSIsCyrillicSupplement = wasmExports.xmlUCSIsCyrillicSupplement)(e), _xmlUCSIsDeseret = Module._xmlUCSIsDeseret = (e) => (_xmlUCSIsDeseret = Module._xmlUCSIsDeseret = wasmExports.xmlUCSIsDeseret)(e), _xmlUCSIsDevanagari = Module._xmlUCSIsDevanagari = (e) => (_xmlUCSIsDevanagari = Module._xmlUCSIsDevanagari = wasmExports.xmlUCSIsDevanagari)(e), _xmlUCSIsDingbats = Module._xmlUCSIsDingbats = (e) => (_xmlUCSIsDingbats = Module._xmlUCSIsDingbats = wasmExports.xmlUCSIsDingbats)(e), _xmlUCSIsEnclosedAlphanumerics = Module._xmlUCSIsEnclosedAlphanumerics = (e) => (_xmlUCSIsEnclosedAlphanumerics = Module._xmlUCSIsEnclosedAlphanumerics = wasmExports.xmlUCSIsEnclosedAlphanumerics)(e), _xmlUCSIsEnclosedCJKLettersandMonths = Module._xmlUCSIsEnclosedCJKLettersandMonths = (e) => (_xmlUCSIsEnclosedCJKLettersandMonths = Module._xmlUCSIsEnclosedCJKLettersandMonths = wasmExports.xmlUCSIsEnclosedCJKLettersandMonths)(e), _xmlUCSIsEthiopic = Module._xmlUCSIsEthiopic = (e) => (_xmlUCSIsEthiopic = Module._xmlUCSIsEthiopic = wasmExports.xmlUCSIsEthiopic)(e), _xmlUCSIsGeneralPunctuation = Module._xmlUCSIsGeneralPunctuation = (e) => (_xmlUCSIsGeneralPunctuation = Module._xmlUCSIsGeneralPunctuation = wasmExports.xmlUCSIsGeneralPunctuation)(e), _xmlUCSIsGeometricShapes = Module._xmlUCSIsGeometricShapes = (e) => (_xmlUCSIsGeometricShapes = Module._xmlUCSIsGeometricShapes = wasmExports.xmlUCSIsGeometricShapes)(e), _xmlUCSIsGeorgian = Module._xmlUCSIsGeorgian = (e) => (_xmlUCSIsGeorgian = Module._xmlUCSIsGeorgian = wasmExports.xmlUCSIsGeorgian)(e), _xmlUCSIsGothic = Module._xmlUCSIsGothic = (e) => (_xmlUCSIsGothic = Module._xmlUCSIsGothic = wasmExports.xmlUCSIsGothic)(e), _xmlUCSIsGreek = Module._xmlUCSIsGreek = (e) => (_xmlUCSIsGreek = Module._xmlUCSIsGreek = wasmExports.xmlUCSIsGreek)(e), _xmlUCSIsGreekExtended = Module._xmlUCSIsGreekExtended = (e) => (_xmlUCSIsGreekExtended = Module._xmlUCSIsGreekExtended = wasmExports.xmlUCSIsGreekExtended)(e), _xmlUCSIsGreekandCoptic = Module._xmlUCSIsGreekandCoptic = (e) => (_xmlUCSIsGreekandCoptic = Module._xmlUCSIsGreekandCoptic = wasmExports.xmlUCSIsGreekandCoptic)(e), _xmlUCSIsGujarati = Module._xmlUCSIsGujarati = (e) => (_xmlUCSIsGujarati = Module._xmlUCSIsGujarati = wasmExports.xmlUCSIsGujarati)(e), _xmlUCSIsGurmukhi = Module._xmlUCSIsGurmukhi = (e) => (_xmlUCSIsGurmukhi = Module._xmlUCSIsGurmukhi = wasmExports.xmlUCSIsGurmukhi)(e), _xmlUCSIsHalfwidthandFullwidthForms = Module._xmlUCSIsHalfwidthandFullwidthForms = (e) => (_xmlUCSIsHalfwidthandFullwidthForms = Module._xmlUCSIsHalfwidthandFullwidthForms = wasmExports.xmlUCSIsHalfwidthandFullwidthForms)(e), _xmlUCSIsHangulCompatibilityJamo = Module._xmlUCSIsHangulCompatibilityJamo = (e) => (_xmlUCSIsHangulCompatibilityJamo = Module._xmlUCSIsHangulCompatibilityJamo = wasmExports.xmlUCSIsHangulCompatibilityJamo)(e), _xmlUCSIsHangulJamo = Module._xmlUCSIsHangulJamo = (e) => (_xmlUCSIsHangulJamo = Module._xmlUCSIsHangulJamo = wasmExports.xmlUCSIsHangulJamo)(e), _xmlUCSIsHangulSyllables = Module._xmlUCSIsHangulSyllables = (e) => (_xmlUCSIsHangulSyllables = Module._xmlUCSIsHangulSyllables = wasmExports.xmlUCSIsHangulSyllables)(e), _xmlUCSIsHanunoo = Module._xmlUCSIsHanunoo = (e) => (_xmlUCSIsHanunoo = Module._xmlUCSIsHanunoo = wasmExports.xmlUCSIsHanunoo)(e), _xmlUCSIsHebrew = Module._xmlUCSIsHebrew = (e) => (_xmlUCSIsHebrew = Module._xmlUCSIsHebrew = wasmExports.xmlUCSIsHebrew)(e), _xmlUCSIsHighPrivateUseSurrogates = Module._xmlUCSIsHighPrivateUseSurrogates = (e) => (_xmlUCSIsHighPrivateUseSurrogates = Module._xmlUCSIsHighPrivateUseSurrogates = wasmExports.xmlUCSIsHighPrivateUseSurrogates)(e), _xmlUCSIsHighSurrogates = Module._xmlUCSIsHighSurrogates = (e) => (_xmlUCSIsHighSurrogates = Module._xmlUCSIsHighSurrogates = wasmExports.xmlUCSIsHighSurrogates)(e), _xmlUCSIsHiragana = Module._xmlUCSIsHiragana = (e) => (_xmlUCSIsHiragana = Module._xmlUCSIsHiragana = wasmExports.xmlUCSIsHiragana)(e), _xmlUCSIsIPAExtensions = Module._xmlUCSIsIPAExtensions = (e) => (_xmlUCSIsIPAExtensions = Module._xmlUCSIsIPAExtensions = wasmExports.xmlUCSIsIPAExtensions)(e), _xmlUCSIsIdeographicDescriptionCharacters = Module._xmlUCSIsIdeographicDescriptionCharacters = (e) => (_xmlUCSIsIdeographicDescriptionCharacters = Module._xmlUCSIsIdeographicDescriptionCharacters = wasmExports.xmlUCSIsIdeographicDescriptionCharacters)(e), _xmlUCSIsKanbun = Module._xmlUCSIsKanbun = (e) => (_xmlUCSIsKanbun = Module._xmlUCSIsKanbun = wasmExports.xmlUCSIsKanbun)(e), _xmlUCSIsKangxiRadicals = Module._xmlUCSIsKangxiRadicals = (e) => (_xmlUCSIsKangxiRadicals = Module._xmlUCSIsKangxiRadicals = wasmExports.xmlUCSIsKangxiRadicals)(e), _xmlUCSIsKannada = Module._xmlUCSIsKannada = (e) => (_xmlUCSIsKannada = Module._xmlUCSIsKannada = wasmExports.xmlUCSIsKannada)(e), _xmlUCSIsKatakana = Module._xmlUCSIsKatakana = (e) => (_xmlUCSIsKatakana = Module._xmlUCSIsKatakana = wasmExports.xmlUCSIsKatakana)(e), _xmlUCSIsKatakanaPhoneticExtensions = Module._xmlUCSIsKatakanaPhoneticExtensions = (e) => (_xmlUCSIsKatakanaPhoneticExtensions = Module._xmlUCSIsKatakanaPhoneticExtensions = wasmExports.xmlUCSIsKatakanaPhoneticExtensions)(e), _xmlUCSIsKhmer = Module._xmlUCSIsKhmer = (e) => (_xmlUCSIsKhmer = Module._xmlUCSIsKhmer = wasmExports.xmlUCSIsKhmer)(e), _xmlUCSIsKhmerSymbols = Module._xmlUCSIsKhmerSymbols = (e) => (_xmlUCSIsKhmerSymbols = Module._xmlUCSIsKhmerSymbols = wasmExports.xmlUCSIsKhmerSymbols)(e), _xmlUCSIsLao = Module._xmlUCSIsLao = (e) => (_xmlUCSIsLao = Module._xmlUCSIsLao = wasmExports.xmlUCSIsLao)(e), _xmlUCSIsLatin1Supplement = Module._xmlUCSIsLatin1Supplement = (e) => (_xmlUCSIsLatin1Supplement = Module._xmlUCSIsLatin1Supplement = wasmExports.xmlUCSIsLatin1Supplement)(e), _xmlUCSIsLatinExtendedA = Module._xmlUCSIsLatinExtendedA = (e) => (_xmlUCSIsLatinExtendedA = Module._xmlUCSIsLatinExtendedA = wasmExports.xmlUCSIsLatinExtendedA)(e), _xmlUCSIsLatinExtendedB = Module._xmlUCSIsLatinExtendedB = (e) => (_xmlUCSIsLatinExtendedB = Module._xmlUCSIsLatinExtendedB = wasmExports.xmlUCSIsLatinExtendedB)(e), _xmlUCSIsLatinExtendedAdditional = Module._xmlUCSIsLatinExtendedAdditional = (e) => (_xmlUCSIsLatinExtendedAdditional = Module._xmlUCSIsLatinExtendedAdditional = wasmExports.xmlUCSIsLatinExtendedAdditional)(e), _xmlUCSIsLetterlikeSymbols = Module._xmlUCSIsLetterlikeSymbols = (e) => (_xmlUCSIsLetterlikeSymbols = Module._xmlUCSIsLetterlikeSymbols = wasmExports.xmlUCSIsLetterlikeSymbols)(e), _xmlUCSIsLimbu = Module._xmlUCSIsLimbu = (e) => (_xmlUCSIsLimbu = Module._xmlUCSIsLimbu = wasmExports.xmlUCSIsLimbu)(e), _xmlUCSIsLinearBIdeograms = Module._xmlUCSIsLinearBIdeograms = (e) => (_xmlUCSIsLinearBIdeograms = Module._xmlUCSIsLinearBIdeograms = wasmExports.xmlUCSIsLinearBIdeograms)(e), _xmlUCSIsLinearBSyllabary = Module._xmlUCSIsLinearBSyllabary = (e) => (_xmlUCSIsLinearBSyllabary = Module._xmlUCSIsLinearBSyllabary = wasmExports.xmlUCSIsLinearBSyllabary)(e), _xmlUCSIsLowSurrogates = Module._xmlUCSIsLowSurrogates = (e) => (_xmlUCSIsLowSurrogates = Module._xmlUCSIsLowSurrogates = wasmExports.xmlUCSIsLowSurrogates)(e), _xmlUCSIsMalayalam = Module._xmlUCSIsMalayalam = (e) => (_xmlUCSIsMalayalam = Module._xmlUCSIsMalayalam = wasmExports.xmlUCSIsMalayalam)(e), _xmlUCSIsMathematicalAlphanumericSymbols = Module._xmlUCSIsMathematicalAlphanumericSymbols = (e) => (_xmlUCSIsMathematicalAlphanumericSymbols = Module._xmlUCSIsMathematicalAlphanumericSymbols = wasmExports.xmlUCSIsMathematicalAlphanumericSymbols)(e), _xmlUCSIsMathematicalOperators = Module._xmlUCSIsMathematicalOperators = (e) => (_xmlUCSIsMathematicalOperators = Module._xmlUCSIsMathematicalOperators = wasmExports.xmlUCSIsMathematicalOperators)(e), _xmlUCSIsMiscellaneousMathematicalSymbolsA = Module._xmlUCSIsMiscellaneousMathematicalSymbolsA = (e) => (_xmlUCSIsMiscellaneousMathematicalSymbolsA = Module._xmlUCSIsMiscellaneousMathematicalSymbolsA = wasmExports.xmlUCSIsMiscellaneousMathematicalSymbolsA)(e), _xmlUCSIsMiscellaneousMathematicalSymbolsB = Module._xmlUCSIsMiscellaneousMathematicalSymbolsB = (e) => (_xmlUCSIsMiscellaneousMathematicalSymbolsB = Module._xmlUCSIsMiscellaneousMathematicalSymbolsB = wasmExports.xmlUCSIsMiscellaneousMathematicalSymbolsB)(e), _xmlUCSIsMiscellaneousSymbols = Module._xmlUCSIsMiscellaneousSymbols = (e) => (_xmlUCSIsMiscellaneousSymbols = Module._xmlUCSIsMiscellaneousSymbols = wasmExports.xmlUCSIsMiscellaneousSymbols)(e), _xmlUCSIsMiscellaneousSymbolsandArrows = Module._xmlUCSIsMiscellaneousSymbolsandArrows = (e) => (_xmlUCSIsMiscellaneousSymbolsandArrows = Module._xmlUCSIsMiscellaneousSymbolsandArrows = wasmExports.xmlUCSIsMiscellaneousSymbolsandArrows)(e), _xmlUCSIsMiscellaneousTechnical = Module._xmlUCSIsMiscellaneousTechnical = (e) => (_xmlUCSIsMiscellaneousTechnical = Module._xmlUCSIsMiscellaneousTechnical = wasmExports.xmlUCSIsMiscellaneousTechnical)(e), _xmlUCSIsMongolian = Module._xmlUCSIsMongolian = (e) => (_xmlUCSIsMongolian = Module._xmlUCSIsMongolian = wasmExports.xmlUCSIsMongolian)(e), _xmlUCSIsMusicalSymbols = Module._xmlUCSIsMusicalSymbols = (e) => (_xmlUCSIsMusicalSymbols = Module._xmlUCSIsMusicalSymbols = wasmExports.xmlUCSIsMusicalSymbols)(e), _xmlUCSIsMyanmar = Module._xmlUCSIsMyanmar = (e) => (_xmlUCSIsMyanmar = Module._xmlUCSIsMyanmar = wasmExports.xmlUCSIsMyanmar)(e), _xmlUCSIsNumberForms = Module._xmlUCSIsNumberForms = (e) => (_xmlUCSIsNumberForms = Module._xmlUCSIsNumberForms = wasmExports.xmlUCSIsNumberForms)(e), _xmlUCSIsOgham = Module._xmlUCSIsOgham = (e) => (_xmlUCSIsOgham = Module._xmlUCSIsOgham = wasmExports.xmlUCSIsOgham)(e), _xmlUCSIsOldItalic = Module._xmlUCSIsOldItalic = (e) => (_xmlUCSIsOldItalic = Module._xmlUCSIsOldItalic = wasmExports.xmlUCSIsOldItalic)(e), _xmlUCSIsOpticalCharacterRecognition = Module._xmlUCSIsOpticalCharacterRecognition = (e) => (_xmlUCSIsOpticalCharacterRecognition = Module._xmlUCSIsOpticalCharacterRecognition = wasmExports.xmlUCSIsOpticalCharacterRecognition)(e), _xmlUCSIsOriya = Module._xmlUCSIsOriya = (e) => (_xmlUCSIsOriya = Module._xmlUCSIsOriya = wasmExports.xmlUCSIsOriya)(e), _xmlUCSIsOsmanya = Module._xmlUCSIsOsmanya = (e) => (_xmlUCSIsOsmanya = Module._xmlUCSIsOsmanya = wasmExports.xmlUCSIsOsmanya)(e), _xmlUCSIsPhoneticExtensions = Module._xmlUCSIsPhoneticExtensions = (e) => (_xmlUCSIsPhoneticExtensions = Module._xmlUCSIsPhoneticExtensions = wasmExports.xmlUCSIsPhoneticExtensions)(e), _xmlUCSIsPrivateUse = Module._xmlUCSIsPrivateUse = (e) => (_xmlUCSIsPrivateUse = Module._xmlUCSIsPrivateUse = wasmExports.xmlUCSIsPrivateUse)(e), _xmlUCSIsPrivateUseArea = Module._xmlUCSIsPrivateUseArea = (e) => (_xmlUCSIsPrivateUseArea = Module._xmlUCSIsPrivateUseArea = wasmExports.xmlUCSIsPrivateUseArea)(e), _xmlUCSIsRunic = Module._xmlUCSIsRunic = (e) => (_xmlUCSIsRunic = Module._xmlUCSIsRunic = wasmExports.xmlUCSIsRunic)(e), _xmlUCSIsShavian = Module._xmlUCSIsShavian = (e) => (_xmlUCSIsShavian = Module._xmlUCSIsShavian = wasmExports.xmlUCSIsShavian)(e), _xmlUCSIsSinhala = Module._xmlUCSIsSinhala = (e) => (_xmlUCSIsSinhala = Module._xmlUCSIsSinhala = wasmExports.xmlUCSIsSinhala)(e), _xmlUCSIsSmallFormVariants = Module._xmlUCSIsSmallFormVariants = (e) => (_xmlUCSIsSmallFormVariants = Module._xmlUCSIsSmallFormVariants = wasmExports.xmlUCSIsSmallFormVariants)(e), _xmlUCSIsSpacingModifierLetters = Module._xmlUCSIsSpacingModifierLetters = (e) => (_xmlUCSIsSpacingModifierLetters = Module._xmlUCSIsSpacingModifierLetters = wasmExports.xmlUCSIsSpacingModifierLetters)(e), _xmlUCSIsSpecials = Module._xmlUCSIsSpecials = (e) => (_xmlUCSIsSpecials = Module._xmlUCSIsSpecials = wasmExports.xmlUCSIsSpecials)(e), _xmlUCSIsSuperscriptsandSubscripts = Module._xmlUCSIsSuperscriptsandSubscripts = (e) => (_xmlUCSIsSuperscriptsandSubscripts = Module._xmlUCSIsSuperscriptsandSubscripts = wasmExports.xmlUCSIsSuperscriptsandSubscripts)(e), _xmlUCSIsSupplementalArrowsA = Module._xmlUCSIsSupplementalArrowsA = (e) => (_xmlUCSIsSupplementalArrowsA = Module._xmlUCSIsSupplementalArrowsA = wasmExports.xmlUCSIsSupplementalArrowsA)(e), _xmlUCSIsSupplementalArrowsB = Module._xmlUCSIsSupplementalArrowsB = (e) => (_xmlUCSIsSupplementalArrowsB = Module._xmlUCSIsSupplementalArrowsB = wasmExports.xmlUCSIsSupplementalArrowsB)(e), _xmlUCSIsSupplementalMathematicalOperators = Module._xmlUCSIsSupplementalMathematicalOperators = (e) => (_xmlUCSIsSupplementalMathematicalOperators = Module._xmlUCSIsSupplementalMathematicalOperators = wasmExports.xmlUCSIsSupplementalMathematicalOperators)(e), _xmlUCSIsSupplementaryPrivateUseAreaA = Module._xmlUCSIsSupplementaryPrivateUseAreaA = (e) => (_xmlUCSIsSupplementaryPrivateUseAreaA = Module._xmlUCSIsSupplementaryPrivateUseAreaA = wasmExports.xmlUCSIsSupplementaryPrivateUseAreaA)(e), _xmlUCSIsSupplementaryPrivateUseAreaB = Module._xmlUCSIsSupplementaryPrivateUseAreaB = (e) => (_xmlUCSIsSupplementaryPrivateUseAreaB = Module._xmlUCSIsSupplementaryPrivateUseAreaB = wasmExports.xmlUCSIsSupplementaryPrivateUseAreaB)(e), _xmlUCSIsSyriac = Module._xmlUCSIsSyriac = (e) => (_xmlUCSIsSyriac = Module._xmlUCSIsSyriac = wasmExports.xmlUCSIsSyriac)(e), _xmlUCSIsTagalog = Module._xmlUCSIsTagalog = (e) => (_xmlUCSIsTagalog = Module._xmlUCSIsTagalog = wasmExports.xmlUCSIsTagalog)(e), _xmlUCSIsTagbanwa = Module._xmlUCSIsTagbanwa = (e) => (_xmlUCSIsTagbanwa = Module._xmlUCSIsTagbanwa = wasmExports.xmlUCSIsTagbanwa)(e), _xmlUCSIsTags = Module._xmlUCSIsTags = (e) => (_xmlUCSIsTags = Module._xmlUCSIsTags = wasmExports.xmlUCSIsTags)(e), _xmlUCSIsTaiLe = Module._xmlUCSIsTaiLe = (e) => (_xmlUCSIsTaiLe = Module._xmlUCSIsTaiLe = wasmExports.xmlUCSIsTaiLe)(e), _xmlUCSIsTaiXuanJingSymbols = Module._xmlUCSIsTaiXuanJingSymbols = (e) => (_xmlUCSIsTaiXuanJingSymbols = Module._xmlUCSIsTaiXuanJingSymbols = wasmExports.xmlUCSIsTaiXuanJingSymbols)(e), _xmlUCSIsTamil = Module._xmlUCSIsTamil = (e) => (_xmlUCSIsTamil = Module._xmlUCSIsTamil = wasmExports.xmlUCSIsTamil)(e), _xmlUCSIsTelugu = Module._xmlUCSIsTelugu = (e) => (_xmlUCSIsTelugu = Module._xmlUCSIsTelugu = wasmExports.xmlUCSIsTelugu)(e), _xmlUCSIsThaana = Module._xmlUCSIsThaana = (e) => (_xmlUCSIsThaana = Module._xmlUCSIsThaana = wasmExports.xmlUCSIsThaana)(e), _xmlUCSIsThai = Module._xmlUCSIsThai = (e) => (_xmlUCSIsThai = Module._xmlUCSIsThai = wasmExports.xmlUCSIsThai)(e), _xmlUCSIsTibetan = Module._xmlUCSIsTibetan = (e) => (_xmlUCSIsTibetan = Module._xmlUCSIsTibetan = wasmExports.xmlUCSIsTibetan)(e), _xmlUCSIsUgaritic = Module._xmlUCSIsUgaritic = (e) => (_xmlUCSIsUgaritic = Module._xmlUCSIsUgaritic = wasmExports.xmlUCSIsUgaritic)(e), _xmlUCSIsUnifiedCanadianAboriginalSyllabics = Module._xmlUCSIsUnifiedCanadianAboriginalSyllabics = (e) => (_xmlUCSIsUnifiedCanadianAboriginalSyllabics = Module._xmlUCSIsUnifiedCanadianAboriginalSyllabics = wasmExports.xmlUCSIsUnifiedCanadianAboriginalSyllabics)(e), _xmlUCSIsVariationSelectors = Module._xmlUCSIsVariationSelectors = (e) => (_xmlUCSIsVariationSelectors = Module._xmlUCSIsVariationSelectors = wasmExports.xmlUCSIsVariationSelectors)(e), _xmlUCSIsVariationSelectorsSupplement = Module._xmlUCSIsVariationSelectorsSupplement = (e) => (_xmlUCSIsVariationSelectorsSupplement = Module._xmlUCSIsVariationSelectorsSupplement = wasmExports.xmlUCSIsVariationSelectorsSupplement)(e), _xmlUCSIsYiRadicals = Module._xmlUCSIsYiRadicals = (e) => (_xmlUCSIsYiRadicals = Module._xmlUCSIsYiRadicals = wasmExports.xmlUCSIsYiRadicals)(e), _xmlUCSIsYiSyllables = Module._xmlUCSIsYiSyllables = (e) => (_xmlUCSIsYiSyllables = Module._xmlUCSIsYiSyllables = wasmExports.xmlUCSIsYiSyllables)(e), _xmlUCSIsYijingHexagramSymbols = Module._xmlUCSIsYijingHexagramSymbols = (e) => (_xmlUCSIsYijingHexagramSymbols = Module._xmlUCSIsYijingHexagramSymbols = wasmExports.xmlUCSIsYijingHexagramSymbols)(e), _xmlUCSIsCatCs = Module._xmlUCSIsCatCs = (e) => (_xmlUCSIsCatCs = Module._xmlUCSIsCatCs = wasmExports.xmlUCSIsCatCs)(e), ___small_fprintf = Module.___small_fprintf = (e, t2, r) => (___small_fprintf = Module.___small_fprintf = wasmExports.__small_fprintf)(e, t2, r), _xmlXPathBooleanFunction = Module._xmlXPathBooleanFunction = (e, t2) => (_xmlXPathBooleanFunction = Module._xmlXPathBooleanFunction = wasmExports.xmlXPathBooleanFunction)(e, t2), _xmlXPathCeilingFunction = Module._xmlXPathCeilingFunction = (e, t2) => (_xmlXPathCeilingFunction = Module._xmlXPathCeilingFunction = wasmExports.xmlXPathCeilingFunction)(e, t2), _xmlXPathCountFunction = Module._xmlXPathCountFunction = (e, t2) => (_xmlXPathCountFunction = Module._xmlXPathCountFunction = wasmExports.xmlXPathCountFunction)(e, t2), _xmlXPathConcatFunction = Module._xmlXPathConcatFunction = (e, t2) => (_xmlXPathConcatFunction = Module._xmlXPathConcatFunction = wasmExports.xmlXPathConcatFunction)(e, t2), _xmlXPathContainsFunction = Module._xmlXPathContainsFunction = (e, t2) => (_xmlXPathContainsFunction = Module._xmlXPathContainsFunction = wasmExports.xmlXPathContainsFunction)(e, t2), _xmlXPathIdFunction = Module._xmlXPathIdFunction = (e, t2) => (_xmlXPathIdFunction = Module._xmlXPathIdFunction = wasmExports.xmlXPathIdFunction)(e, t2), _xmlXPathFalseFunction = Module._xmlXPathFalseFunction = (e, t2) => (_xmlXPathFalseFunction = Module._xmlXPathFalseFunction = wasmExports.xmlXPathFalseFunction)(e, t2), _xmlXPathFloorFunction = Module._xmlXPathFloorFunction = (e, t2) => (_xmlXPathFloorFunction = Module._xmlXPathFloorFunction = wasmExports.xmlXPathFloorFunction)(e, t2), _xmlXPathLastFunction = Module._xmlXPathLastFunction = (e, t2) => (_xmlXPathLastFunction = Module._xmlXPathLastFunction = wasmExports.xmlXPathLastFunction)(e, t2), _xmlXPathLangFunction = Module._xmlXPathLangFunction = (e, t2) => (_xmlXPathLangFunction = Module._xmlXPathLangFunction = wasmExports.xmlXPathLangFunction)(e, t2), _xmlXPathLocalNameFunction = Module._xmlXPathLocalNameFunction = (e, t2) => (_xmlXPathLocalNameFunction = Module._xmlXPathLocalNameFunction = wasmExports.xmlXPathLocalNameFunction)(e, t2), _xmlXPathNotFunction = Module._xmlXPathNotFunction = (e, t2) => (_xmlXPathNotFunction = Module._xmlXPathNotFunction = wasmExports.xmlXPathNotFunction)(e, t2), _xmlXPathNamespaceURIFunction = Module._xmlXPathNamespaceURIFunction = (e, t2) => (_xmlXPathNamespaceURIFunction = Module._xmlXPathNamespaceURIFunction = wasmExports.xmlXPathNamespaceURIFunction)(e, t2), _xmlXPathNormalizeFunction = Module._xmlXPathNormalizeFunction = (e, t2) => (_xmlXPathNormalizeFunction = Module._xmlXPathNormalizeFunction = wasmExports.xmlXPathNormalizeFunction)(e, t2), _xmlXPathNumberFunction = Module._xmlXPathNumberFunction = (e, t2) => (_xmlXPathNumberFunction = Module._xmlXPathNumberFunction = wasmExports.xmlXPathNumberFunction)(e, t2), _xmlXPathPositionFunction = Module._xmlXPathPositionFunction = (e, t2) => (_xmlXPathPositionFunction = Module._xmlXPathPositionFunction = wasmExports.xmlXPathPositionFunction)(e, t2), _xmlXPathRoundFunction = Module._xmlXPathRoundFunction = (e, t2) => (_xmlXPathRoundFunction = Module._xmlXPathRoundFunction = wasmExports.xmlXPathRoundFunction)(e, t2), _xmlXPathStringFunction = Module._xmlXPathStringFunction = (e, t2) => (_xmlXPathStringFunction = Module._xmlXPathStringFunction = wasmExports.xmlXPathStringFunction)(e, t2), _xmlXPathStringLengthFunction = Module._xmlXPathStringLengthFunction = (e, t2) => (_xmlXPathStringLengthFunction = Module._xmlXPathStringLengthFunction = wasmExports.xmlXPathStringLengthFunction)(e, t2), _xmlXPathStartsWithFunction = Module._xmlXPathStartsWithFunction = (e, t2) => (_xmlXPathStartsWithFunction = Module._xmlXPathStartsWithFunction = wasmExports.xmlXPathStartsWithFunction)(e, t2), _xmlXPathSubstringFunction = Module._xmlXPathSubstringFunction = (e, t2) => (_xmlXPathSubstringFunction = Module._xmlXPathSubstringFunction = wasmExports.xmlXPathSubstringFunction)(e, t2), _xmlXPathSubstringBeforeFunction = Module._xmlXPathSubstringBeforeFunction = (e, t2) => (_xmlXPathSubstringBeforeFunction = Module._xmlXPathSubstringBeforeFunction = wasmExports.xmlXPathSubstringBeforeFunction)(e, t2), _xmlXPathSubstringAfterFunction = Module._xmlXPathSubstringAfterFunction = (e, t2) => (_xmlXPathSubstringAfterFunction = Module._xmlXPathSubstringAfterFunction = wasmExports.xmlXPathSubstringAfterFunction)(e, t2), _xmlXPathSumFunction = Module._xmlXPathSumFunction = (e, t2) => (_xmlXPathSumFunction = Module._xmlXPathSumFunction = wasmExports.xmlXPathSumFunction)(e, t2), _xmlXPathTrueFunction = Module._xmlXPathTrueFunction = (e, t2) => (_xmlXPathTrueFunction = Module._xmlXPathTrueFunction = wasmExports.xmlXPathTrueFunction)(e, t2), _xmlXPathTranslateFunction = Module._xmlXPathTranslateFunction = (e, t2) => (_xmlXPathTranslateFunction = Module._xmlXPathTranslateFunction = wasmExports.xmlXPathTranslateFunction)(e, t2), _xmlXPathNextSelf = Module._xmlXPathNextSelf = (e, t2) => (_xmlXPathNextSelf = Module._xmlXPathNextSelf = wasmExports.xmlXPathNextSelf)(e, t2), _xmlXPathNextChild = Module._xmlXPathNextChild = (e, t2) => (_xmlXPathNextChild = Module._xmlXPathNextChild = wasmExports.xmlXPathNextChild)(e, t2), _xmlXPathNextDescendant = Module._xmlXPathNextDescendant = (e, t2) => (_xmlXPathNextDescendant = Module._xmlXPathNextDescendant = wasmExports.xmlXPathNextDescendant)(e, t2), _xmlXPathNextDescendantOrSelf = Module._xmlXPathNextDescendantOrSelf = (e, t2) => (_xmlXPathNextDescendantOrSelf = Module._xmlXPathNextDescendantOrSelf = wasmExports.xmlXPathNextDescendantOrSelf)(e, t2), _xmlXPathNextParent = Module._xmlXPathNextParent = (e, t2) => (_xmlXPathNextParent = Module._xmlXPathNextParent = wasmExports.xmlXPathNextParent)(e, t2), _xmlXPathNextAncestor = Module._xmlXPathNextAncestor = (e, t2) => (_xmlXPathNextAncestor = Module._xmlXPathNextAncestor = wasmExports.xmlXPathNextAncestor)(e, t2), _xmlXPathNextAncestorOrSelf = Module._xmlXPathNextAncestorOrSelf = (e, t2) => (_xmlXPathNextAncestorOrSelf = Module._xmlXPathNextAncestorOrSelf = wasmExports.xmlXPathNextAncestorOrSelf)(e, t2), _xmlXPathNextFollowingSibling = Module._xmlXPathNextFollowingSibling = (e, t2) => (_xmlXPathNextFollowingSibling = Module._xmlXPathNextFollowingSibling = wasmExports.xmlXPathNextFollowingSibling)(e, t2), _xmlXPathNextPrecedingSibling = Module._xmlXPathNextPrecedingSibling = (e, t2) => (_xmlXPathNextPrecedingSibling = Module._xmlXPathNextPrecedingSibling = wasmExports.xmlXPathNextPrecedingSibling)(e, t2), _xmlXPathNextFollowing = Module._xmlXPathNextFollowing = (e, t2) => (_xmlXPathNextFollowing = Module._xmlXPathNextFollowing = wasmExports.xmlXPathNextFollowing)(e, t2), _xmlXPathNextNamespace = Module._xmlXPathNextNamespace = (e, t2) => (_xmlXPathNextNamespace = Module._xmlXPathNextNamespace = wasmExports.xmlXPathNextNamespace)(e, t2), _xmlXPathNextAttribute = Module._xmlXPathNextAttribute = (e, t2) => (_xmlXPathNextAttribute = Module._xmlXPathNextAttribute = wasmExports.xmlXPathNextAttribute)(e, t2), _zcalloc = Module._zcalloc = (e, t2, r) => (_zcalloc = Module._zcalloc = wasmExports.zcalloc)(e, t2, r), _zcfree = Module._zcfree = (e, t2) => (_zcfree = Module._zcfree = wasmExports.zcfree)(e, t2), _memset = Module._memset = (e, t2, r) => (_memset = Module._memset = wasmExports.memset)(e, t2, r), _strerror = Module._strerror = (e) => (_strerror = Module._strerror = wasmExports.strerror)(e), _memmove = Module._memmove = (e, t2, r) => (_memmove = Module._memmove = wasmExports.memmove)(e, t2, r), _sysconf = Module._sysconf = (e) => (_sysconf = Module._sysconf = wasmExports.sysconf)(e), ___multf3 = Module.___multf3 = (e, t2, r, a2, o4) => (___multf3 = Module.___multf3 = wasmExports.__multf3)(e, t2, r, a2, o4), ___subtf3 = Module.___subtf3 = (e, t2, r, a2, o4) => (___subtf3 = Module.___subtf3 = wasmExports.__subtf3)(e, t2, r, a2, o4), ___lttf2 = Module.___lttf2 = (e, t2, r, a2) => (___lttf2 = Module.___lttf2 = wasmExports.__lttf2)(e, t2, r, a2), ___fixtfsi = Module.___fixtfsi = (e, t2) => (___fixtfsi = Module.___fixtfsi = wasmExports.__fixtfsi)(e, t2), ___floatsitf = Module.___floatsitf = (e, t2) => (___floatsitf = Module.___floatsitf = wasmExports.__floatsitf)(e, t2), ___extenddftf2 = Module.___extenddftf2 = (e, t2) => (___extenddftf2 = Module.___extenddftf2 = wasmExports.__extenddftf2)(e, t2), ___getf2 = Module.___getf2 = (e, t2, r, a2) => (___getf2 = Module.___getf2 = wasmExports.__getf2)(e, t2, r, a2), _pthread_mutex_lock = Module._pthread_mutex_lock = (e) => (_pthread_mutex_lock = Module._pthread_mutex_lock = wasmExports.pthread_mutex_lock)(e), _pthread_mutex_unlock = Module._pthread_mutex_unlock = (e) => (_pthread_mutex_unlock = Module._pthread_mutex_unlock = wasmExports.pthread_mutex_unlock)(e), _strcasecmp = Module._strcasecmp = (e, t2) => (_strcasecmp = Module._strcasecmp = wasmExports.strcasecmp)(e, t2), ___dl_seterr = (e, t2) => (___dl_seterr = wasmExports.__dl_seterr)(e, t2), _emscripten_builtin_memalign = (e, t2) => (_emscripten_builtin_memalign = wasmExports.emscripten_builtin_memalign)(e, t2), _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports.emscripten_stack_get_current)(), _perror = Module._perror = (e) => (_perror = Module._perror = wasmExports.perror)(e), _putc = Module._putc = (e, t2) => (_putc = Module._putc = wasmExports.putc)(e, t2), ___letf2 = Module.___letf2 = (e, t2, r, a2) => (___letf2 = Module.___letf2 = wasmExports.__letf2)(e, t2, r, a2), _pthread_sigmask = Module._pthread_sigmask = (e, t2, r) => (_pthread_sigmask = Module._pthread_sigmask = wasmExports.pthread_sigmask)(e, t2, r), _freelocale = Module._freelocale = (e) => (_freelocale = Module._freelocale = wasmExports.freelocale)(e), _getentropy = Module._getentropy = (e, t2) => (_getentropy = Module._getentropy = wasmExports.getentropy)(e, t2), _getgid = Module._getgid = () => (_getgid = Module._getgid = wasmExports.getgid)(), _htons = (e) => (_htons = wasmExports.htons)(e), _ntohs = Module._ntohs = (e) => (_ntohs = Module._ntohs = wasmExports.ntohs)(e), _getuid = Module._getuid = () => (_getuid = Module._getuid = wasmExports.getuid)(), _qsort = Module._qsort = (e, t2, r, a2) => (_qsort = Module._qsort = wasmExports.qsort)(e, t2, r, a2), _gmtime = Module._gmtime = (e) => (_gmtime = Module._gmtime = wasmExports.gmtime)(e), _htonl = (e) => (_htonl = wasmExports.htonl)(e), _ioctl = Module._ioctl = (e, t2, r) => (_ioctl = Module._ioctl = wasmExports.ioctl)(e, t2, r), _pthread_getspecific = Module._pthread_getspecific = (e) => (_pthread_getspecific = Module._pthread_getspecific = wasmExports.pthread_getspecific)(e), _pthread_setspecific = Module._pthread_setspecific = (e, t2) => (_pthread_setspecific = Module._pthread_setspecific = wasmExports.pthread_setspecific)(e, t2), _pthread_atfork = Module._pthread_atfork = (e, t2, r) => (_pthread_atfork = Module._pthread_atfork = wasmExports.pthread_atfork)(e, t2, r), _pthread_rwlock_init = Module._pthread_rwlock_init = (e, t2) => (_pthread_rwlock_init = Module._pthread_rwlock_init = wasmExports.pthread_rwlock_init)(e, t2), _pthread_rwlock_destroy = Module._pthread_rwlock_destroy = (e) => (_pthread_rwlock_destroy = Module._pthread_rwlock_destroy = wasmExports.pthread_rwlock_destroy)(e), _pthread_rwlock_rdlock = Module._pthread_rwlock_rdlock = (e) => (_pthread_rwlock_rdlock = Module._pthread_rwlock_rdlock = wasmExports.pthread_rwlock_rdlock)(e), _pthread_rwlock_wrlock = Module._pthread_rwlock_wrlock = (e) => (_pthread_rwlock_wrlock = Module._pthread_rwlock_wrlock = wasmExports.pthread_rwlock_wrlock)(e), _pthread_rwlock_unlock = Module._pthread_rwlock_unlock = (e) => (_pthread_rwlock_unlock = Module._pthread_rwlock_unlock = wasmExports.pthread_rwlock_unlock)(e), _pthread_key_delete = Module._pthread_key_delete = (e) => (_pthread_key_delete = Module._pthread_key_delete = wasmExports.pthread_key_delete)(e), _pthread_key_create = Module._pthread_key_create = (e, t2) => (_pthread_key_create = Module._pthread_key_create = wasmExports.pthread_key_create)(e, t2), _pthread_once = Module._pthread_once = (e, t2) => (_pthread_once = Module._pthread_once = wasmExports.pthread_once)(e, t2), _madvise = Module._madvise = (e, t2, r) => (_madvise = Module._madvise = wasmExports.madvise)(e, t2, r), _gmtime_r = Module._gmtime_r = (e, t2) => (_gmtime_r = Module._gmtime_r = wasmExports.gmtime_r)(e, t2), _mlock = Module._mlock = (e, t2) => (_mlock = Module._mlock = wasmExports.mlock)(e, t2), _mprotect = Module._mprotect = (e, t2, r) => (_mprotect = Module._mprotect = wasmExports.mprotect)(e, t2, r), _tcsetattr = Module._tcsetattr = (e, t2, r) => (_tcsetattr = Module._tcsetattr = wasmExports.tcsetattr)(e, t2, r), _pthread_self = Module._pthread_self = () => (_pthread_self = Module._pthread_self = wasmExports.pthread_self)(), _sigismember = Module._sigismember = (e, t2) => (_sigismember = Module._sigismember = wasmExports.sigismember)(e, t2), _sigpending = Module._sigpending = (e) => (_sigpending = Module._sigpending = wasmExports.sigpending)(e), _srand = Module._srand = (e) => (_srand = Module._srand = wasmExports.srand)(e), _rand = Module._rand = () => (_rand = Module._rand = wasmExports.rand)(), _setbuf = Module._setbuf = (e, t2) => (_setbuf = Module._setbuf = wasmExports.setbuf)(e, t2), __emscripten_timeout = (e, t2) => (__emscripten_timeout = wasmExports._emscripten_timeout)(e, t2), _signal = Module._signal = (e, t2) => (_signal = Module._signal = wasmExports.signal)(e, t2), _sigwait = Module._sigwait = (e, t2) => (_sigwait = Module._sigwait = wasmExports.sigwait)(e, t2), _strncasecmp = Module._strncasecmp = (e, t2, r) => (_strncasecmp = Module._strncasecmp = wasmExports.strncasecmp)(e, t2, r), _strncat = Module._strncat = (e, t2, r) => (_strncat = Module._strncat = wasmExports.strncat)(e, t2, r), _strxfrm_l = Module._strxfrm_l = (e, t2, r, a2) => (_strxfrm_l = Module._strxfrm_l = wasmExports.strxfrm_l)(e, t2, r, a2), _tcgetattr = Module._tcgetattr = (e, t2) => (_tcgetattr = Module._tcgetattr = wasmExports.tcgetattr)(e, t2), _setThrew = (e, t2) => (_setThrew = wasmExports.setThrew)(e, t2), __emscripten_tempret_set = (e) => (__emscripten_tempret_set = wasmExports._emscripten_tempret_set)(e), __emscripten_tempret_get = () => (__emscripten_tempret_get = wasmExports._emscripten_tempret_get)(), __emscripten_stack_restore = (e) => (__emscripten_stack_restore = wasmExports._emscripten_stack_restore)(e), __emscripten_stack_alloc = (e) => (__emscripten_stack_alloc = wasmExports._emscripten_stack_alloc)(e), _gethostbyname = Module._gethostbyname = (e) => (_gethostbyname = Module._gethostbyname = wasmExports.gethostbyname)(e), _getsockname = Module._getsockname = (e, t2, r) => (_getsockname = Module._getsockname = wasmExports.getsockname)(e, t2, r), _shutdown = Module._shutdown = (e, t2) => (_shutdown = Module._shutdown = wasmExports.shutdown)(e, t2), ___wasm_apply_data_relocs = () => (___wasm_apply_data_relocs = wasmExports.__wasm_apply_data_relocs)(), _stderr = Module._stderr = 15161616, _InterruptPending = Module._InterruptPending = 15306048, _MyLatch = Module._MyLatch = 15306236, _CritSectionCount = Module._CritSectionCount = 15306100, _MyProc = Module._MyProc = 15275852, _pg_global_prng_state = Module._pg_global_prng_state = 15252432, _error_context_stack = Module._error_context_stack = 15304344, _GUC_check_errdetail_string = Module._GUC_check_errdetail_string = 15309996, _IsUnderPostmaster = Module._IsUnderPostmaster = 15306129, _CurrentMemoryContext = Module._CurrentMemoryContext = 15311424, _stdout = Module._stdout = 15161920, _debug_query_string = Module._debug_query_string = 15166860, _MyProcPort = Module._MyProcPort = 15306224, ___THREW__ = Module.___THREW__ = 15331188, ___threwValue = Module.___threwValue = 15331192, _MyDatabaseId = Module._MyDatabaseId = 15306108, _TopMemoryContext = Module._TopMemoryContext = 15311428, _PG_exception_stack = Module._PG_exception_stack = 15304348, _MyProcPid = Module._MyProcPid = 15306200, _stdin = Module._stdin = 15161768, _ScanKeywords = Module._ScanKeywords = 14994472, _pg_number_of_ones = Module._pg_number_of_ones = 13560256, _LocalBufferBlockPointers = Module._LocalBufferBlockPointers = 15272428, _BufferBlocks = Module._BufferBlocks = 15267164, _wal_level = Module._wal_level = 15008352, _SnapshotAnyData = Module._SnapshotAnyData = 15094528, _maintenance_work_mem = Module._maintenance_work_mem = 15042008, _ParallelWorkerNumber = Module._ParallelWorkerNumber = 14999912, _MainLWLockArray = Module._MainLWLockArray = 15274036, _CurrentResourceOwner = Module._CurrentResourceOwner = 15311472, _work_mem = Module._work_mem = 15041992, _NBuffers = Module._NBuffers = 15042016, _bsysscan = Module._bsysscan = 15253668, _CheckXidAlive = Module._CheckXidAlive = 15253664, _RecentXmin = Module._RecentXmin = 15094620, _TTSOpsHeapTuple = Module._TTSOpsHeapTuple = 15012092, _XactIsoLevel = Module._XactIsoLevel = 15008216, _pgWalUsage = Module._pgWalUsage = 15257136, _pgBufferUsage = Module._pgBufferUsage = 15257008, _TTSOpsVirtual = Module._TTSOpsVirtual = 15012040, _TransamVariables = Module._TransamVariables = 15253656, _TopTransactionContext = Module._TopTransactionContext = 15311448, _RmgrTable = Module._RmgrTable = 14999936, _process_shared_preload_libraries_in_progress = Module._process_shared_preload_libraries_in_progress = 15309392, _wal_segment_size = Module._wal_segment_size = 15008372, _TopTransactionResourceOwner = Module._TopTransactionResourceOwner = 15311480, _arch_module_check_errdetail_string = Module._arch_module_check_errdetail_string = 15266548, _object_access_hook = Module._object_access_hook = 15255776, _InvalidObjectAddress = Module._InvalidObjectAddress = 14155804, _check_function_bodies = Module._check_function_bodies = 15042182, _post_parse_analyze_hook = Module._post_parse_analyze_hook = 15255816, _ScanKeywordTokens = Module._ScanKeywordTokens = 14186880, _SPI_processed = Module._SPI_processed = 15257160, _SPI_tuptable = Module._SPI_tuptable = 15257168, _CacheMemoryContext = Module._CacheMemoryContext = 15311440, _WalReceiverFunctions = Module._WalReceiverFunctions = 15266940, _TTSOpsMinimalTuple = Module._TTSOpsMinimalTuple = 15012144, _check_password_hook = Module._check_password_hook = 15256084, _ConfigReloadPending = Module._ConfigReloadPending = 15266536, _max_parallel_maintenance_workers = Module._max_parallel_maintenance_workers = 15042012, _DateStyle = Module._DateStyle = 15041980, _ExecutorStart_hook = Module._ExecutorStart_hook = 15256984, _ExecutorRun_hook = Module._ExecutorRun_hook = 15256988, _ExecutorFinish_hook = Module._ExecutorFinish_hook = 15256992, _ExecutorEnd_hook = Module._ExecutorEnd_hook = 15256996, _SPI_result = Module._SPI_result = 15257172, _ClientAuthentication_hook = Module._ClientAuthentication_hook = 15257344, _cpu_tuple_cost = Module._cpu_tuple_cost = 15012600, _cpu_operator_cost = Module._cpu_operator_cost = 15012616, _seq_page_cost = Module._seq_page_cost = 15012584, _planner_hook = Module._planner_hook = 15266232, _ShutdownRequestPending = Module._ShutdownRequestPending = 15266540, _MyStartTime = Module._MyStartTime = 15306208, _cluster_name = Module._cluster_name = 15042232, _application_name = Module._application_name = 15310220, _BufferDescriptors = Module._BufferDescriptors = 15267160, _shmem_startup_hook = Module._shmem_startup_hook = 15273108, _ProcessUtility_hook = Module._ProcessUtility_hook = 15275940, _IntervalStyle = Module._IntervalStyle = 15306132, _extra_float_digits = Module._extra_float_digits = 15032408, _pg_crc32_table = Module._pg_crc32_table = 14747456, _xmlFree = Module._xmlFree = 15143832, _xmlStructuredError = Module._xmlStructuredError = 15312996, _xmlStructuredErrorContext = Module._xmlStructuredErrorContext = 15313004, _xmlGenericErrorContext = Module._xmlGenericErrorContext = 15313000, _xmlGenericError = Module._xmlGenericError = 15143868, _xmlIsBaseCharGroup = Module._xmlIsBaseCharGroup = 15143232, _xmlIsDigitGroup = Module._xmlIsDigitGroup = 15143264, _xmlIsCombiningGroup = Module._xmlIsCombiningGroup = 15143248, _xmlIsExtenderGroup = Module._xmlIsExtenderGroup = 15143280, _ErrorContext = Module._ErrorContext = 15311432, _shmem_request_hook = Module._shmem_request_hook = 15309396, _xmlIsPubidChar_tab = Module._xmlIsPubidChar_tab = 14788752, _xmlMalloc = Module._xmlMalloc = 15143836, _xmlRealloc = Module._xmlRealloc = 15143844, _xmlGetWarningsDefaultValue = Module._xmlGetWarningsDefaultValue = 15143860, _xmlLastError = Module._xmlLastError = 15313016, _xmlMallocAtomic = Module._xmlMallocAtomic = 15143840, _xmlMemStrdup = Module._xmlMemStrdup = 15143848, _xmlBufferAllocScheme = Module._xmlBufferAllocScheme = 15143852, _xmlDefaultBufferSize = Module._xmlDefaultBufferSize = 15143856, _xmlParserDebugEntities = Module._xmlParserDebugEntities = 15312956, _xmlDoValidityCheckingDefaultValue = Module._xmlDoValidityCheckingDefaultValue = 15312960, _xmlLoadExtDtdDefaultValue = Module._xmlLoadExtDtdDefaultValue = 15312964, _xmlPedanticParserDefaultValue = Module._xmlPedanticParserDefaultValue = 15312968, _xmlLineNumbersDefaultValue = Module._xmlLineNumbersDefaultValue = 15312972, _xmlKeepBlanksDefaultValue = Module._xmlKeepBlanksDefaultValue = 15143864, _xmlSubstituteEntitiesDefaultValue = Module._xmlSubstituteEntitiesDefaultValue = 15312976, _xmlRegisterNodeDefaultValue = Module._xmlRegisterNodeDefaultValue = 15312980, _xmlDeregisterNodeDefaultValue = Module._xmlDeregisterNodeDefaultValue = 15312984, _xmlParserInputBufferCreateFilenameValue = Module._xmlParserInputBufferCreateFilenameValue = 15312988, _xmlOutputBufferCreateFilenameValue = Module._xmlOutputBufferCreateFilenameValue = 15312992, _xmlIndentTreeOutput = Module._xmlIndentTreeOutput = 15143872, _xmlTreeIndentString = Module._xmlTreeIndentString = 15143876, _xmlSaveNoEmptyTags = Module._xmlSaveNoEmptyTags = 15313008, _xmlDefaultSAXHandler = Module._xmlDefaultSAXHandler = 15143880, _xmlDefaultSAXLocator = Module._xmlDefaultSAXLocator = 15143992, _xmlParserMaxDepth = Module._xmlParserMaxDepth = 15144260, _xmlStringText = Module._xmlStringText = 14790560, _xmlStringComment = Module._xmlStringComment = 14790575, _xmlStringTextNoenc = Module._xmlStringTextNoenc = 14790565, _xmlXPathNAN = Module._xmlXPathNAN = 15313672, _xmlXPathNINF = Module._xmlXPathNINF = 15313688, _xmlXPathPINF = Module._xmlXPathPINF = 15313680, _z_errmsg = Module._z_errmsg = 15160816, __length_code = Module.__length_code = 14810224, __dist_code = Module.__dist_code = 14809712;
    function invoke_iii(e, t2, r) {
      var a2 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r);
      } catch (o4) {
        if (stackRestore(a2), o4 !== o4 + 0)
          throw o4;
        _setThrew(1, 0);
      }
    }
    function invoke_viiii(e, t2, r, a2, o4) {
      var s4 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a2, o4);
      } catch (l3) {
        if (stackRestore(s4), l3 !== l3 + 0)
          throw l3;
        _setThrew(1, 0);
      }
    }
    function invoke_vi(e, t2) {
      var r = stackSave();
      try {
        getWasmTableEntry(e)(t2);
      } catch (a2) {
        if (stackRestore(r), a2 !== a2 + 0)
          throw a2;
        _setThrew(1, 0);
      }
    }
    function invoke_v(e) {
      var t2 = stackSave();
      try {
        getWasmTableEntry(e)();
      } catch (r) {
        if (stackRestore(t2), r !== r + 0)
          throw r;
        _setThrew(1, 0);
      }
    }
    function invoke_j(e) {
      var t2 = stackSave();
      try {
        return getWasmTableEntry(e)();
      } catch (r) {
        if (stackRestore(t2), r !== r + 0)
          throw r;
        return _setThrew(1, 0), 0n;
      }
    }
    function invoke_viiiiii(e, t2, r, a2, o4, s4, l3) {
      var _3 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a2, o4, s4, l3);
      } catch (n3) {
        if (stackRestore(_3), n3 !== n3 + 0)
          throw n3;
        _setThrew(1, 0);
      }
    }
    function invoke_vii(e, t2, r) {
      var a2 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r);
      } catch (o4) {
        if (stackRestore(a2), o4 !== o4 + 0)
          throw o4;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiii(e, t2, r, a2, o4, s4) {
      var l3 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2, o4, s4);
      } catch (_3) {
        if (stackRestore(l3), _3 !== _3 + 0)
          throw _3;
        _setThrew(1, 0);
      }
    }
    function invoke_i(e) {
      var t2 = stackSave();
      try {
        return getWasmTableEntry(e)();
      } catch (r) {
        if (stackRestore(t2), r !== r + 0)
          throw r;
        _setThrew(1, 0);
      }
    }
    function invoke_ii(e, t2) {
      var r = stackSave();
      try {
        return getWasmTableEntry(e)(t2);
      } catch (a2) {
        if (stackRestore(r), a2 !== a2 + 0)
          throw a2;
        _setThrew(1, 0);
      }
    }
    function invoke_viii(e, t2, r, a2) {
      var o4 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a2);
      } catch (s4) {
        if (stackRestore(o4), s4 !== s4 + 0)
          throw s4;
        _setThrew(1, 0);
      }
    }
    function invoke_iiii(e, t2, r, a2) {
      var o4 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2);
      } catch (s4) {
        if (stackRestore(o4), s4 !== s4 + 0)
          throw s4;
        _setThrew(1, 0);
      }
    }
    function invoke_vji(e, t2, r) {
      var a2 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r);
      } catch (o4) {
        if (stackRestore(a2), o4 !== o4 + 0)
          throw o4;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiiii(e, t2, r, a2, o4, s4, l3, _3) {
      var n3 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2, o4, s4, l3, _3);
      } catch (m5) {
        if (stackRestore(n3), m5 !== m5 + 0)
          throw m5;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiii(e, t2, r, a2, o4) {
      var s4 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2, o4);
      } catch (l3) {
        if (stackRestore(s4), l3 !== l3 + 0)
          throw l3;
        _setThrew(1, 0);
      }
    }
    function invoke_viiiiiiiii(e, t2, r, a2, o4, s4, l3, _3, n3, m5) {
      var p4 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a2, o4, s4, l3, _3, n3, m5);
      } catch (d3) {
        if (stackRestore(p4), d3 !== d3 + 0)
          throw d3;
        _setThrew(1, 0);
      }
    }
    function invoke_viiiii(e, t2, r, a2, o4, s4) {
      var l3 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a2, o4, s4);
      } catch (_3) {
        if (stackRestore(l3), _3 !== _3 + 0)
          throw _3;
        _setThrew(1, 0);
      }
    }
    function invoke_jii(e, t2, r) {
      var a2 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r);
      } catch (o4) {
        if (stackRestore(a2), o4 !== o4 + 0)
          throw o4;
        return _setThrew(1, 0), 0n;
      }
    }
    function invoke_ji(e, t2) {
      var r = stackSave();
      try {
        return getWasmTableEntry(e)(t2);
      } catch (a2) {
        if (stackRestore(r), a2 !== a2 + 0)
          throw a2;
        return _setThrew(1, 0), 0n;
      }
    }
    function invoke_jiiiiiiiii(e, t2, r, a2, o4, s4, l3, _3, n3, m5) {
      var p4 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2, o4, s4, l3, _3, n3, m5);
      } catch (d3) {
        if (stackRestore(p4), d3 !== d3 + 0)
          throw d3;
        return _setThrew(1, 0), 0n;
      }
    }
    function invoke_jiiiiii(e, t2, r, a2, o4, s4, l3) {
      var _3 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2, o4, s4, l3);
      } catch (n3) {
        if (stackRestore(_3), n3 !== n3 + 0)
          throw n3;
        return _setThrew(1, 0), 0n;
      }
    }
    function invoke_iiiiiiiiiiiiii(e, t2, r, a2, o4, s4, l3, _3, n3, m5, p4, d3, g5, u2) {
      var f3 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2, o4, s4, l3, _3, n3, m5, p4, d3, g5, u2);
      } catch (c2) {
        if (stackRestore(f3), c2 !== c2 + 0)
          throw c2;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiijii(e, t2, r, a2, o4, s4, l3) {
      var _3 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2, o4, s4, l3);
      } catch (n3) {
        if (stackRestore(_3), n3 !== n3 + 0)
          throw n3;
        _setThrew(1, 0);
      }
    }
    function invoke_vijiji(e, t2, r, a2, o4, s4) {
      var l3 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a2, o4, s4);
      } catch (_3) {
        if (stackRestore(l3), _3 !== _3 + 0)
          throw _3;
        _setThrew(1, 0);
      }
    }
    function invoke_viji(e, t2, r, a2) {
      var o4 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a2);
      } catch (s4) {
        if (stackRestore(o4), s4 !== s4 + 0)
          throw s4;
        _setThrew(1, 0);
      }
    }
    function invoke_iiji(e, t2, r, a2) {
      var o4 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2);
      } catch (s4) {
        if (stackRestore(o4), s4 !== s4 + 0)
          throw s4;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiiiii(e, t2, r, a2, o4, s4, l3, _3, n3) {
      var m5 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2, o4, s4, l3, _3, n3);
      } catch (p4) {
        if (stackRestore(m5), p4 !== p4 + 0)
          throw p4;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiiiiiiiiiiiiii(e, t2, r, a2, o4, s4, l3, _3, n3, m5, p4, d3, g5, u2, f3, c2, w4, v3) {
      var S3 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2, o4, s4, l3, _3, n3, m5, p4, d3, g5, u2, f3, c2, w4, v3);
      } catch (x6) {
        if (stackRestore(S3), x6 !== x6 + 0)
          throw x6;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiij(e, t2, r, a2, o4) {
      var s4 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2, o4);
      } catch (l3) {
        if (stackRestore(s4), l3 !== l3 + 0)
          throw l3;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiii(e, t2, r, a2, o4, s4, l3) {
      var _3 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2, o4, s4, l3);
      } catch (n3) {
        if (stackRestore(_3), n3 !== n3 + 0)
          throw n3;
        _setThrew(1, 0);
      }
    }
    function invoke_vj(e, t2) {
      var r = stackSave();
      try {
        getWasmTableEntry(e)(t2);
      } catch (a2) {
        if (stackRestore(r), a2 !== a2 + 0)
          throw a2;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiiiiii(e, t2, r, a2, o4, s4, l3, _3, n3, m5) {
      var p4 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2, o4, s4, l3, _3, n3, m5);
      } catch (d3) {
        if (stackRestore(p4), d3 !== d3 + 0)
          throw d3;
        _setThrew(1, 0);
      }
    }
    function invoke_viiji(e, t2, r, a2, o4) {
      var s4 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a2, o4);
      } catch (l3) {
        if (stackRestore(s4), l3 !== l3 + 0)
          throw l3;
        _setThrew(1, 0);
      }
    }
    function invoke_viiiiiiii(e, t2, r, a2, o4, s4, l3, _3, n3) {
      var m5 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a2, o4, s4, l3, _3, n3);
      } catch (p4) {
        if (stackRestore(m5), p4 !== p4 + 0)
          throw p4;
        _setThrew(1, 0);
      }
    }
    function invoke_vij(e, t2, r) {
      var a2 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r);
      } catch (o4) {
        if (stackRestore(a2), o4 !== o4 + 0)
          throw o4;
        _setThrew(1, 0);
      }
    }
    function invoke_ij(e, t2) {
      var r = stackSave();
      try {
        return getWasmTableEntry(e)(t2);
      } catch (a2) {
        if (stackRestore(r), a2 !== a2 + 0)
          throw a2;
        _setThrew(1, 0);
      }
    }
    function invoke_viiiiiii(e, t2, r, a2, o4, s4, l3, _3) {
      var n3 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a2, o4, s4, l3, _3);
      } catch (m5) {
        if (stackRestore(n3), m5 !== m5 + 0)
          throw m5;
        _setThrew(1, 0);
      }
    }
    function invoke_viiiji(e, t2, r, a2, o4, s4) {
      var l3 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a2, o4, s4);
      } catch (_3) {
        if (stackRestore(l3), _3 !== _3 + 0)
          throw _3;
        _setThrew(1, 0);
      }
    }
    function invoke_iiij(e, t2, r, a2) {
      var o4 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2);
      } catch (s4) {
        if (stackRestore(o4), s4 !== s4 + 0)
          throw s4;
        _setThrew(1, 0);
      }
    }
    function invoke_vid(e, t2, r) {
      var a2 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r);
      } catch (o4) {
        if (stackRestore(a2), o4 !== o4 + 0)
          throw o4;
        _setThrew(1, 0);
      }
    }
    function invoke_ijiiiiii(e, t2, r, a2, o4, s4, l3, _3) {
      var n3 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2, o4, s4, l3, _3);
      } catch (m5) {
        if (stackRestore(n3), m5 !== m5 + 0)
          throw m5;
        _setThrew(1, 0);
      }
    }
    function invoke_viijii(e, t2, r, a2, o4, s4) {
      var l3 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a2, o4, s4);
      } catch (_3) {
        if (stackRestore(l3), _3 !== _3 + 0)
          throw _3;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiji(e, t2, r, a2, o4, s4, l3) {
      var _3 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2, o4, s4, l3);
      } catch (n3) {
        if (stackRestore(_3), n3 !== n3 + 0)
          throw n3;
        _setThrew(1, 0);
      }
    }
    function invoke_viijiiii(e, t2, r, a2, o4, s4, l3, _3) {
      var n3 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a2, o4, s4, l3, _3);
      } catch (m5) {
        if (stackRestore(n3), m5 !== m5 + 0)
          throw m5;
        _setThrew(1, 0);
      }
    }
    function invoke_viij(e, t2, r, a2) {
      var o4 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a2);
      } catch (s4) {
        if (stackRestore(o4), s4 !== s4 + 0)
          throw s4;
        _setThrew(1, 0);
      }
    }
    function invoke_jiiii(e, t2, r, a2, o4) {
      var s4 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2, o4);
      } catch (l3) {
        if (stackRestore(s4), l3 !== l3 + 0)
          throw l3;
        return _setThrew(1, 0), 0n;
      }
    }
    function invoke_viiiiiiiiiiii(e, t2, r, a2, o4, s4, l3, _3, n3, m5, p4, d3, g5) {
      var u2 = stackSave();
      try {
        getWasmTableEntry(e)(t2, r, a2, o4, s4, l3, _3, n3, m5, p4, d3, g5);
      } catch (f3) {
        if (stackRestore(u2), f3 !== f3 + 0)
          throw f3;
        _setThrew(1, 0);
      }
    }
    function invoke_di(e, t2) {
      var r = stackSave();
      try {
        return getWasmTableEntry(e)(t2);
      } catch (a2) {
        if (stackRestore(r), a2 !== a2 + 0)
          throw a2;
        _setThrew(1, 0);
      }
    }
    function invoke_id(e, t2) {
      var r = stackSave();
      try {
        return getWasmTableEntry(e)(t2);
      } catch (a2) {
        if (stackRestore(r), a2 !== a2 + 0)
          throw a2;
        _setThrew(1, 0);
      }
    }
    function invoke_ijiiiii(e, t2, r, a2, o4, s4, l3) {
      var _3 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2, o4, s4, l3);
      } catch (n3) {
        if (stackRestore(_3), n3 !== n3 + 0)
          throw n3;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiiiiiii(e, t2, r, a2, o4, s4, l3, _3, n3, m5, p4) {
      var d3 = stackSave();
      try {
        return getWasmTableEntry(e)(t2, r, a2, o4, s4, l3, _3, n3, m5, p4);
      } catch (g5) {
        if (stackRestore(d3), g5 !== g5 + 0)
          throw g5;
        _setThrew(1, 0);
      }
    }
    Module.addRunDependency = addRunDependency, Module.removeRunDependency = removeRunDependency, Module.getTempRet0 = getTempRet0, Module.setTempRet0 = setTempRet0, Module.setValue = setValue, Module.getValue = getValue, Module.UTF8ToString = UTF8ToString, Module.stringToNewUTF8 = stringToNewUTF8, Module.stringToUTF8OnStack = stringToUTF8OnStack, Module.FS_createPreloadedFile = FS_createPreloadedFile, Module.FS_unlink = FS_unlink, Module.FS_createPath = FS_createPath, Module.FS_createDevice = FS_createDevice, Module.FS = FS, Module.FS_createDataFile = FS_createDataFile, Module.FS_createLazyFile = FS_createLazyFile, Module.MEMFS = MEMFS, Module.IDBFS = IDBFS;
    var calledRun;
    dependenciesFulfilled = function e() {
      calledRun || run(), calledRun || (dependenciesFulfilled = e);
    };
    function callMain(e = []) {
      var t2 = resolveGlobalSymbol("main").sym;
      if (t2) {
        e.unshift(thisProgram);
        var r = e.length, a2 = stackAlloc((r + 1) * 4), o4 = a2;
        e.forEach((l3) => {
          HEAPU32[o4 >> 2] = stringToUTF8OnStack(l3), o4 += 4;
        }), HEAPU32[o4 >> 2] = 0;
        try {
          var s4 = t2(r, a2);
          return exitJS(s4, true), s4;
        } catch (l3) {
          return handleException(l3);
        }
      }
    }
    function run(e = arguments_) {
      if (runDependencies > 0 || (preRun(), runDependencies > 0))
        return;
      function t2() {
        calledRun || (calledRun = true, Module.calledRun = true, !ABORT && (initRuntime(), preMain(), readyPromiseResolve(Module), Module.onRuntimeInitialized?.(), shouldRunNow && callMain(e), postRun()));
      }
      Module.setStatus ? (Module.setStatus("Running..."), setTimeout(() => {
        setTimeout(() => Module.setStatus(""), 1), t2();
      }, 1)) : t2();
    }
    if (Module.preInit)
      for (typeof Module.preInit == "function" && (Module.preInit = [Module.preInit]);Module.preInit.length > 0; )
        Module.preInit.pop()();
    var shouldRunNow = true;
    return Module.noInitialRun && (shouldRunNow = false), run(), moduleRtn = readyPromise, moduleRtn;
  };
})();
var Ue2 = Ze2;
var Re2 = Ue2;
var J2;
var j3;
var V2;
var Q2;
var $3;
var ie;
var me2;
var pe2;
var de2;
var Z2;
var ae;
var oe;
var se2;
var le2;
var K2;
var H4;
var A2;
var Y2;
var T3;
var De2;
var re2;
var ze2;
var Ne2;
var ue2 = class ue3 extends F3 {
  constructor(r = {}, a2 = {}) {
    super();
    R(this, T3);
    R(this, J2, false);
    R(this, j3, false);
    R(this, V2, false);
    R(this, Q2, false);
    R(this, $3, false);
    R(this, ie, new X2);
    R(this, me2, new X2);
    R(this, pe2, new X2);
    R(this, de2, new X2);
    R(this, Z2, false);
    R(this, ae, "cma");
    this.debug = 0;
    R(this, oe);
    R(this, se2, []);
    R(this, le2, new ye);
    R(this, K2);
    R(this, H4);
    R(this, A2, new Map);
    R(this, Y2, new Set);
    typeof r == "string" ? a2 = { dataDir: r, ...a2 } : a2 = r, this.dataDir = a2.dataDir, a2.parsers !== undefined && (this.parsers = { ...this.parsers, ...a2.parsers }), a2.serializers !== undefined && (this.serializers = { ...this.serializers, ...a2.serializers }), a2?.debug !== undefined && (this.debug = a2.debug), a2?.relaxedDurability !== undefined && x(this, $3, a2.relaxedDurability), a2?.defaultDataTransferContainer !== undefined && x(this, ae, a2.defaultDataTransferContainer), x(this, oe, a2.extensions ?? {}), this.waitReady = T(this, T3, De2).call(this, a2 ?? {});
  }
  static async create(r, a2) {
    let o4 = typeof r == "string" ? { dataDir: r, ...a2 ?? {} } : r ?? {}, s4 = new ue3(o4);
    return await s4.waitReady, s4;
  }
  get Module() {
    return this.mod;
  }
  get ready() {
    return h(this, J2) && !h(this, j3) && !h(this, V2);
  }
  get closed() {
    return h(this, V2);
  }
  async close() {
    await this._checkReady(), x(this, j3, true);
    for (let r of h(this, se2))
      await r();
    try {
      await this.execProtocol(O.end()), this.mod._pgl_shutdown();
    } catch (r) {
      let a2 = r;
      if (!(a2.name === "ExitStatus" && a2.status === 0))
        throw r;
    }
    await this.fs.closeFs(), x(this, V2, true), x(this, j3, false);
  }
  async[Symbol.asyncDispose]() {
    await this.close();
  }
  async _handleBlob(r) {
    x(this, K2, r ? await r.arrayBuffer() : undefined);
  }
  async _cleanupBlob() {
    x(this, K2, undefined);
  }
  async _getWrittenBlob() {
    if (!h(this, H4))
      return;
    let r = new Blob(h(this, H4));
    return x(this, H4, undefined), r;
  }
  async _checkReady() {
    if (h(this, j3))
      throw new Error("PGlite is closing");
    if (h(this, V2))
      throw new Error("PGlite is closed");
    h(this, J2) || await this.waitReady;
  }
  execProtocolRawSync(r, a2 = {}) {
    let o4, s4 = this.mod;
    s4._use_wire(1);
    let l3 = r.length, _3 = a2.dataTransferContainer ?? h(this, ae);
    switch (r.length >= s4.FD_BUFFER_MAX && (_3 = "file"), _3) {
      case "cma": {
        s4._interactive_write(r.length), s4.HEAPU8.set(r, 1);
        break;
      }
      case "file": {
        let m5 = "/tmp/pglite/base/.s.PGSQL.5432.lck.in", p4 = "/tmp/pglite/base/.s.PGSQL.5432.in";
        s4._interactive_write(0), s4.FS.writeFile(m5, r), s4.FS.rename(m5, p4);
        break;
      }
      default:
        throw new Error(`Unknown data transfer container: ${_3}`);
    }
    s4._interactive_one();
    let n3 = s4._get_channel();
    switch (n3 < 0 && (_3 = "file"), n3 > 0 && (_3 = "cma"), _3) {
      case "cma": {
        let m5 = l3 + 2, p4 = m5 + s4._interactive_read();
        o4 = s4.HEAPU8.subarray(m5, p4);
        break;
      }
      case "file": {
        let m5 = "/tmp/pglite/base/.s.PGSQL.5432.out";
        try {
          let p4 = s4.FS.stat(m5), d3 = s4.FS.open(m5, "r");
          o4 = new Uint8Array(p4.size), s4.FS.read(d3, o4, 0, p4.size, 0), s4.FS.unlink(m5);
        } catch {
          o4 = new Uint8Array(0);
        }
        break;
      }
      default:
        throw new Error(`Unknown data transfer container: ${_3}`);
    }
    return o4;
  }
  async execProtocolRaw(r, { syncToFs: a2 = true, dataTransferContainer: o4 } = {}) {
    let s4 = this.execProtocolRawSync(r, { dataTransferContainer: o4 });
    return a2 && await this.syncToFs(), s4;
  }
  async execProtocol(r, { syncToFs: a2 = true, throwOnError: o4 = true, onNotice: s4 } = {}) {
    let l3 = await this.execProtocolRaw(r, { syncToFs: a2 }), _3 = [];
    return h(this, le2).parse(l3, (n3) => {
      if (n3 instanceof E) {
        if (x(this, le2, new ye), o4)
          throw n3;
      } else if (n3 instanceof te)
        this.debug > 0 && console.warn(n3), s4 && s4(n3);
      else if (n3 instanceof Z)
        switch (n3.text) {
          case "BEGIN":
            x(this, Q2, true);
            break;
          case "COMMIT":
          case "ROLLBACK":
            x(this, Q2, false);
            break;
        }
      else if (n3 instanceof J) {
        let m5 = h(this, A2).get(n3.channel);
        m5 && m5.forEach((p4) => {
          queueMicrotask(() => p4(n3.payload));
        }), h(this, Y2).forEach((p4) => {
          queueMicrotask(() => p4(n3.channel, n3.payload));
        });
      }
      _3.push(n3);
    }), { messages: _3, data: l3 };
  }
  isInTransaction() {
    return h(this, Q2);
  }
  async syncToFs() {
    if (h(this, Z2))
      return;
    x(this, Z2, true);
    let r = async () => {
      await h(this, de2).runExclusive(async () => {
        x(this, Z2, false), await this.fs.syncToFs(h(this, $3));
      });
    };
    h(this, $3) ? r() : await r();
  }
  async listen(r, a2, o4) {
    return this._runExclusiveListen(() => T(this, T3, ze2).call(this, r, a2, o4));
  }
  async unlisten(r, a2, o4) {
    return this._runExclusiveListen(() => T(this, T3, Ne2).call(this, r, a2, o4));
  }
  onNotification(r) {
    return h(this, Y2).add(r), () => {
      h(this, Y2).delete(r);
    };
  }
  offNotification(r) {
    h(this, Y2).delete(r);
  }
  async dumpDataDir(r) {
    await this._checkReady();
    let a2 = this.dataDir?.split("/").pop() ?? "pgdata";
    return this.fs.dumpTar(a2, r);
  }
  _runExclusiveQuery(r) {
    return h(this, ie).runExclusive(r);
  }
  _runExclusiveTransaction(r) {
    return h(this, me2).runExclusive(r);
  }
  async clone() {
    let r = await this.dumpDataDir("none");
    return ue3.create({ loadDataDir: r });
  }
  _runExclusiveListen(r) {
    return h(this, pe2).runExclusive(r);
  }
};
J2 = new WeakMap, j3 = new WeakMap, V2 = new WeakMap, Q2 = new WeakMap, $3 = new WeakMap, ie = new WeakMap, me2 = new WeakMap, pe2 = new WeakMap, de2 = new WeakMap, Z2 = new WeakMap, ae = new WeakMap, oe = new WeakMap, se2 = new WeakMap, le2 = new WeakMap, K2 = new WeakMap, H4 = new WeakMap, A2 = new WeakMap, Y2 = new WeakMap, T3 = new WeakSet, De2 = async function(r) {
  if (r.fs)
    this.fs = r.fs;
  else {
    let { dataDir: d3, fsType: g5 } = Ae2(r.dataDir);
    this.fs = await Te2(d3, g5);
  }
  let a2 = {}, o4 = [], s4 = [`PGDATA=${C2}`, `PREFIX=${Vr}`, `PGUSER=${r.username ?? "postgres"}`, `PGDATABASE=${r.database ?? "template1"}`, "MODE=REACT", "REPL=N", ...this.debug ? ["-d", this.debug.toString()] : []];
  r.wasmModule || Rr();
  let l3 = r.fsBundle ? r.fsBundle.arrayBuffer() : Er(), _3;
  l3.then((d3) => {
    _3 = d3;
  });
  let n3 = { WASM_PREFIX: Vr, arguments: s4, INITIAL_MEMORY: r.initialMemory, noExitRuntime: true, ...this.debug > 0 ? { print: console.info, printErr: console.error } : { print: () => {
  }, printErr: () => {
  } }, instantiateWasm: (d3, g5) => (Tr(d3, r.wasmModule).then(({ instance: u2, module: f3 }) => {
    g5(u2, f3);
  }), {}), getPreloadedPackage: (d3, g5) => {
    if (d3 === "pglite.data") {
      if (_3.byteLength !== g5)
        throw new Error(`Invalid FS bundle size: ${_3.byteLength} !== ${g5}`);
      return _3;
    }
    throw new Error(`Unknown package: ${d3}`);
  }, preRun: [(d3) => {
    let g5 = d3.FS.makedev(64, 0), u2 = { open: (f3) => {
    }, close: (f3) => {
    }, read: (f3, c2, w4, v3, S3) => {
      let x6 = h(this, K2);
      if (!x6)
        throw new Error("No /dev/blob File or Blob provided to read from");
      let y4 = new Uint8Array(x6);
      if (S3 >= y4.length)
        return 0;
      let M3 = Math.min(y4.length - S3, v3);
      for (let E3 = 0;E3 < M3; E3++)
        c2[w4 + E3] = y4[S3 + E3];
      return M3;
    }, write: (f3, c2, w4, v3, S3) => (h(this, H4) ?? x(this, H4, []), h(this, H4).push(c2.slice(w4, w4 + v3)), v3), llseek: (f3, c2, w4) => {
      let v3 = h(this, K2);
      if (!v3)
        throw new Error("No /dev/blob File or Blob provided to llseek");
      let S3 = c2;
      if (w4 === 1 ? S3 += f3.position : w4 === 2 && (S3 = new Uint8Array(v3).length), S3 < 0)
        throw new d3.FS.ErrnoError(28);
      return S3;
    } };
    d3.FS.registerDevice(g5, u2), d3.FS.mkdev("/dev/blob", g5);
  }] }, { emscriptenOpts: m5 } = await this.fs.init(this, n3);
  n3 = m5;
  for (let [d3, g5] of Object.entries(h(this, oe)))
    if (g5 instanceof URL)
      a2[d3] = xe2(g5);
    else {
      let u2 = await g5.setup(this, n3);
      if (u2.emscriptenOpts && (n3 = u2.emscriptenOpts), u2.namespaceObj) {
        let f3 = this;
        f3[d3] = u2.namespaceObj;
      }
      u2.bundlePath && (a2[d3] = xe2(u2.bundlePath)), u2.init && o4.push(u2.init), u2.close && h(this, se2).push(u2.close);
    }
  if (n3.pg_extensions = a2, await l3, this.mod = await Re2(n3), await this.fs.initialSyncFs(), r.loadDataDir) {
    if (this.mod.FS.analyzePath(C2 + "/PG_VERSION").exists)
      throw new Error("Database already exists, cannot load from tarball");
    T(this, T3, re2).call(this, "pglite: loading data from tarball"), await ce2(this.mod.FS, r.loadDataDir, C2);
  }
  this.mod.FS.analyzePath(C2 + "/PG_VERSION").exists ? T(this, T3, re2).call(this, "pglite: found DB, resuming") : T(this, T3, re2).call(this, "pglite: no db"), await ke2(this.mod, (...d3) => T(this, T3, re2).call(this, ...d3));
  let p4 = this.mod._pgl_initdb();
  if (!p4)
    throw new Error("INITDB failed to return value");
  if (p4 & 1)
    throw new Error("INITDB: failed to execute");
  if (p4 & 2) {
    let d3 = r.username ?? "postgres", g5 = r.database ?? "template1";
    if (p4 & 4) {
      if (!(p4 & 12))
        throw new Error(`INITDB: Invalid db ${g5}/user ${d3} combination`);
    } else if (g5 !== "template1" && d3 !== "postgres")
      throw new Error(`INITDB: created a new datadir ${C2}, but an alternative db ${g5}/user ${d3} was requested`);
  }
  this.mod._pgl_backend(), await this.syncToFs(), x(this, J2, true), await this.exec("SET search_path TO public;"), await this._initArrayTypes();
  for (let d3 of o4)
    await d3();
}, re2 = function(...r) {
  this.debug > 0 && console.log(...r);
}, ze2 = async function(r, a2, o4) {
  let s4 = Nr(r), l3 = o4 ?? this;
  h(this, A2).has(s4) || h(this, A2).set(s4, new Set), h(this, A2).get(s4).add(a2);
  try {
    await l3.exec(`LISTEN ${r}`);
  } catch (_3) {
    throw h(this, A2).get(s4).delete(a2), h(this, A2).get(s4)?.size === 0 && h(this, A2).delete(s4), _3;
  }
  return async (_3) => {
    await this.unlisten(s4, a2, _3);
  };
}, Ne2 = async function(r, a2, o4) {
  let s4 = Nr(r), l3 = o4 ?? this, _3 = async () => {
    await l3.exec(`UNLISTEN ${r}`), h(this, A2).get(s4)?.size === 0 && h(this, A2).delete(s4);
  };
  a2 ? (h(this, A2).get(s4)?.delete(a2), h(this, A2).get(s4)?.size === 0 && await _3()) : await _3();
};
var qe2 = ue2;
u();

// node_modules/@electric-sql/pglite-socket/dist/chunk-ZWGLOPFM.js
import { createServer as u2 } from "net";
var g5 = 60000;
var a2 = class a3 extends EventTarget {
  constructor(e) {
    super();
    this.socket = null;
    this.active = false;
    this.db = e.db, this.closeOnDetach = e.closeOnDetach ?? false, this.inspect = e.inspect ?? false, this.debug = e.debug ?? false, this.id = a3.nextHandlerId++, this.log("constructor: created new handler");
  }
  get handlerId() {
    return this.id;
  }
  log(e, ...t2) {
    this.debug && console.log(`[PGLiteSocketHandler#${this.id}] ${e}`, ...t2);
  }
  async attach(e) {
    if (this.log(`attach: attaching socket from ${e.remoteAddress}:${e.remotePort}`), this.socket)
      throw new Error("Socket already attached");
    return this.socket = e, this.active = true, this.log("attach: waiting for PGlite to be ready"), await this.db.waitReady, this.log("attach: acquiring exclusive lock on PGlite instance"), await new Promise((t2) => {
      this.db.runExclusive(() => (t2(), new Promise((i3, n3) => {
        this.resolveLock = i3, this.rejectLock = n3;
      })));
    }), this.log("attach: setting up socket event handlers"), e.on("data", async (t2) => {
      try {
        let i3 = await this.handleData(t2);
        this.log(`socket on data sent: ${i3} bytes`);
      } catch (i3) {
        this.log("socket on data error: ", i3);
      }
    }), e.on("error", (t2) => this.handleError(t2)), e.on("close", () => this.handleClose()), this;
  }
  detach(e) {
    return this.log(`detach: detaching socket, close=${e ?? this.closeOnDetach}`), this.socket ? (this.socket.removeAllListeners("data"), this.socket.removeAllListeners("error"), this.socket.removeAllListeners("close"), (e ?? this.closeOnDetach) && this.socket.writable && (this.log("detach: closing socket"), this.socket.end(), this.socket.destroy()), this.log("detach: releasing exclusive lock on PGlite instance"), this.resolveLock?.(), this.socket = null, this.active = false, this) : (this.log("detach: no socket attached, nothing to do"), this);
  }
  get isAttached() {
    return this.socket !== null;
  }
  async handleData(e) {
    if (!this.socket || !this.active)
      return this.log("handleData: no active socket, ignoring data"), new Promise((t2, i3) => i3("no active socket"));
    this.log(`handleData: received ${e.length} bytes`), this.inspectData("incoming", e);
    try {
      this.log("handleData: sending data to PGlite for processing");
      let t2 = await this.db.execProtocolRaw(new Uint8Array(e));
      if (this.log(`handleData: received ${t2.length} bytes from PGlite`), this.inspectData("outgoing", t2), this.socket && this.socket.writable && this.active) {
        if (t2.length <= 0)
          return this.log("handleData: cowardly refusing to send empty packet"), new Promise((n3, o4) => o4("no data"));
        let i3 = new Promise((n3, o4) => {
          this.log("handleData: writing response to socket"), this.socket ? this.socket.write(Buffer.from(t2), (r) => {
            r ? o4(`Error while writing to the socket ${r.toString()}`) : n3(t2.length);
          }) : o4("No socket");
        });
        return this.dispatchEvent(new CustomEvent("data", { detail: { incoming: e.length, outgoing: t2.length } })), i3;
      } else
        return this.log("handleData: socket no longer writable or active, discarding response"), new Promise((i3, n3) => n3("No socket, not active or not writeable"));
    } catch (t2) {
      return this.log("handleData: error processing data:", t2), this.handleError(t2), new Promise((i3, n3) => n3(`Error while processing data ${t2.toString()}`));
    }
  }
  handleError(e) {
    this.log("handleError:", e), this.dispatchEvent(new CustomEvent("error", { detail: e })), this.log("handleError: rejecting exclusive lock on PGlite instance"), this.rejectLock?.(e), this.resolveLock = undefined, this.rejectLock = undefined, this.detach(true);
  }
  handleClose() {
    this.log("handleClose: socket closed"), this.dispatchEvent(new CustomEvent("close")), this.detach(false);
  }
  inspectData(e, t2) {
    if (this.inspect) {
      console.log("-".repeat(75)), console.log(e === "incoming" ? "-> incoming" : "<- outgoing", t2.length, "bytes");
      for (let i3 = 0;i3 < t2.length; i3 += 16) {
        let n3 = Math.min(16, t2.length - i3), o4 = "";
        for (let s4 = 0;s4 < 16; s4++)
          if (s4 < n3) {
            let c2 = t2[i3 + s4];
            o4 += c2.toString(16).padStart(2, "0") + " ";
          } else
            o4 += "   ";
        let r = "";
        for (let s4 = 0;s4 < n3; s4++) {
          let c2 = t2[i3 + s4];
          r += c2 >= 32 && c2 <= 126 ? String.fromCharCode(c2) : ".";
        }
        console.log(`${i3.toString(16).padStart(8, "0")}  ${o4} ${r}`);
      }
    }
  }
};
a2.nextHandlerId = 1;
var h2 = a2;
var l3 = class extends EventTarget {
  constructor(e) {
    super();
    this.server = null;
    this.active = false;
    this.activeHandler = null;
    this.connectionQueue = [];
    this.handlerCount = 0;
    this.db = e.db, e.path ? this.path = e.path : (this.port = e.port || 5432, this.host = e.host || "127.0.0.1"), this.inspect = e.inspect ?? false, this.debug = e.debug ?? false, this.connectionQueueTimeout = e.connectionQueueTimeout ?? g5, this.log(`constructor: created server on ${this.host}:${this.port}`), this.log(`constructor: connection queue timeout: ${this.connectionQueueTimeout}ms`);
  }
  log(e, ...t2) {
    this.debug && console.log(`[PGLiteSocketServer] ${e}`, ...t2);
  }
  async start() {
    if (this.log(`start: starting server on ${this.getServerConn()}`), this.server)
      throw new Error("Socket server already started");
    return this.active = true, this.server = u2((e) => this.handleConnection(e)), new Promise((e, t2) => {
      if (!this.server)
        return t2(new Error("Server not initialized"));
      this.server.on("error", (i3) => {
        this.log("start: server error:", i3), this.dispatchEvent(new CustomEvent("error", { detail: i3 })), t2(i3);
      }), this.path ? this.server.listen(this.path, () => {
        this.log(`start: server listening on ${this.getServerConn()}`), this.dispatchEvent(new CustomEvent("listening", { detail: { path: this.path } })), e();
      }) : this.server.listen(this.port, this.host, () => {
        this.log(`start: server listening on ${this.getServerConn()}`), this.dispatchEvent(new CustomEvent("listening", { detail: { port: this.port, host: this.host } })), e();
      });
    });
  }
  getServerConn() {
    return this.path ? this.path : `${this.host}:${this.port}`;
  }
  async stop() {
    return this.log("stop: stopping server"), this.active = false, this.log(`stop: clearing connection queue (${this.connectionQueue.length} connections)`), this.connectionQueue.forEach((e) => {
      clearTimeout(e.timeoutId), e.socket.writable && (this.log(`stop: closing queued connection from ${e.clientInfo.clientAddress}:${e.clientInfo.clientPort}`), e.socket.end());
    }), this.connectionQueue = [], this.activeHandler && (this.log(`stop: detaching active handler #${this.activeHandlerId}`), this.activeHandler.detach(true), this.activeHandler = null), this.server ? new Promise((e) => {
      if (!this.server)
        return e();
      this.server.close(() => {
        this.log("stop: server closed"), this.server = null, this.dispatchEvent(new CustomEvent("close")), e();
      });
    }) : (this.log("stop: server not running, nothing to do"), Promise.resolve());
  }
  get activeHandlerId() {
    return this.activeHandler?.handlerId ?? null;
  }
  async handleConnection(e) {
    let t2 = { clientAddress: e.remoteAddress || "unknown", clientPort: e.remotePort || 0 };
    if (this.log(`handleConnection: new connection from ${t2.clientAddress}:${t2.clientPort}`), !this.active) {
      this.log("handleConnection: server not active, closing connection"), e.end();
      return;
    }
    if (!this.activeHandler || !this.activeHandler.isAttached) {
      this.log("handleConnection: no active handler, attaching socket directly"), this.dispatchEvent(new CustomEvent("connection", { detail: t2 })), await this.attachSocketToNewHandler(e, t2);
      return;
    }
    this.log(`handleConnection: active handler #${this.activeHandlerId} exists, queueing connection`), this.enqueueConnection(e, t2);
  }
  enqueueConnection(e, t2) {
    this.log(`enqueueConnection: queueing connection from ${t2.clientAddress}:${t2.clientPort}, timeout: ${this.connectionQueueTimeout}ms`);
    let i3 = setTimeout(() => {
      this.log(`enqueueConnection: timeout for connection from ${t2.clientAddress}:${t2.clientPort}`), this.connectionQueue = this.connectionQueue.filter((n3) => n3.socket !== e), e.writable && (this.log("enqueueConnection: closing timed out connection"), e.end()), this.dispatchEvent(new CustomEvent("queueTimeout", { detail: { ...t2, queueSize: this.connectionQueue.length } }));
    }, this.connectionQueueTimeout);
    this.connectionQueue.push({ socket: e, clientInfo: t2, timeoutId: i3 }), this.log(`enqueueConnection: connection queued, queue size: ${this.connectionQueue.length}`), this.dispatchEvent(new CustomEvent("queuedConnection", { detail: { ...t2, queueSize: this.connectionQueue.length } }));
  }
  processNextInQueue() {
    if (this.log(`processNextInQueue: processing next connection, queue size: ${this.connectionQueue.length}`), this.connectionQueue.length === 0 || !this.active) {
      this.log("processNextInQueue: no connections in queue or server not active, nothing to do");
      return;
    }
    let e = this.connectionQueue.shift();
    if (e) {
      if (this.log(`processNextInQueue: processing connection from ${e.clientInfo.clientAddress}:${e.clientInfo.clientPort}`), clearTimeout(e.timeoutId), !e.socket.writable) {
        this.log("processNextInQueue: socket no longer writable, skipping to next connection"), this.processNextInQueue();
        return;
      }
      this.attachSocketToNewHandler(e.socket, e.clientInfo).catch((t2) => {
        this.log("processNextInQueue: error attaching socket:", t2), this.dispatchEvent(new CustomEvent("error", { detail: t2 })), this.processNextInQueue();
      });
    }
  }
  async attachSocketToNewHandler(e, t2) {
    this.handlerCount++, this.log(`attachSocketToNewHandler: creating new handler for ${t2.clientAddress}:${t2.clientPort} (handler #${this.handlerCount})`);
    let i3 = new h2({ db: this.db, closeOnDetach: true, inspect: this.inspect, debug: this.debug });
    i3.addEventListener("error", (n3) => {
      this.log(`handler #${i3.handlerId}: error from handler:`, n3.detail), this.dispatchEvent(new CustomEvent("error", { detail: n3.detail }));
    }), i3.addEventListener("close", () => {
      this.log(`handler #${i3.handlerId}: closed`), this.activeHandler === i3 && (this.log(`handler #${i3.handlerId}: was active handler, processing next connection in queue`), this.activeHandler = null, this.processNextInQueue());
    });
    try {
      this.activeHandler = i3, this.log(`handler #${i3.handlerId}: attaching socket`), await i3.attach(e), this.dispatchEvent(new CustomEvent("connection", { detail: t2 }));
    } catch (n3) {
      throw this.log(`handler #${i3.handlerId}: error attaching socket:`, n3), this.activeHandler = null, e.writable && e.end(), n3;
    }
  }
};

// index.ts
import * as fs2 from "fs";
import * as path from "path";

class PGLiteSocketServerRunner {
  socketDir;
  dataDir;
  db = null;
  server = null;
  database;
  username;
  password;
  initialMemory;
  constructor(socketDir, dataDir, database = null, username = null, password = null, initialMemory = null) {
    this.socketDir = socketDir;
    this.dataDir = dataDir;
    this.database = database;
    this.username = username;
    this.password = password;
    this.initialMemory = initialMemory;
  }
  async start() {
    try {
      console.info(`Initializing PGlite database with dataDir: ${this.dataDir}`);
      if (!fs2.existsSync(this.socketDir)) {
        fs2.mkdirSync(this.socketDir, { recursive: true });
        console.info(`Created socket directory: ${this.socketDir}`);
      }
      this.db = await qe2.create({
        dataDir: this.dataDir,
        options: {
          username: this.username,
          password: this.password,
          database: this.database,
          ...this.initialMemory && { initialMemory: this.initialMemory }
        }
      });
      console.info("Testing database connection...");
      const testResult = await this.db.query("SELECT 1 as test");
      console.info(`Database test result: ${JSON.stringify(testResult)}`);
      const serverOptions = {
        db: this.db,
        path: path.join(this.socketDir, ".s.PGSQL.5432")
      };
      console.info(`Starting PGlite socket server on ${serverOptions.path}`);
      this.server = new l3(serverOptions);
      await this.server.start();
      const readyMessage = { id: "ready", success: true };
      console.info(JSON.stringify(readyMessage));
    } catch (error) {
      console.error("Failed to start PGlite socket server:", error.message);
      process.exit(1);
    }
    const shutdown = async () => {
      console.info("Shutting down PGlite socket server...");
      try {
        if (this.server) {
          await this.server.stop();
          console.info("Socket server stopped");
        }
        if (this.db) {
          await this.db.close();
          console.info("Database closed");
        }
        console.info("Shutdown complete");
      } catch (error) {
        console.error("Error during shutdown:", error.message);
      } finally {
        process.exit(0);
      }
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("disconnect", shutdown);
    process.on("uncaughtException", async (error) => {
      console.error("Uncaught exception:", error);
      await shutdown();
    });
    process.on("unhandledRejection", async (reason, promise) => {
      console.error("Unhandled rejection at:", promise, "reason:", reason);
      await shutdown();
    });
  }
}
if (import.meta.main) {
  const args2 = process.argv.slice(2);
  const socketDir = args2[0];
  const dataDir = args2[1];
  const opts = JSON.parse(args2[2]);
  if (!dataDir) {
    console.error("Usage: bun index.ts <socket_path> <data_dir> [opts]");
    console.error("  socket_path: Unix socket path");
    console.error("  data_dir: Database directory");
    console.error("  opts: JSON string of options");
    process.exit(1);
  }
  const runner = new PGLiteSocketServerRunner(socketDir, dataDir, opts.database, opts.username, opts.password, opts.initialMemory);
  runner.start();
}
var pglite_default = PGLiteSocketServerRunner;
export {
  pglite_default as default
};
