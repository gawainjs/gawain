let newIdCount = 0;
export function newId(prefix) {
    return (prefix || `_`) + newIdCount++;
}

export function str(s) {
    return `"${s}"`; // TODO
}

let currentIndent = 0;
export function print(s) {
    if (!s) {
        console.log();
        return;
    }

    if (s.match(/^\s*\}/)) {
        --currentIndent;
        if (currentIndent < 0) throw 'negative indent reached';
    }

    s = s.replace(new RegExp(`^\\s{0,${currentIndent * 4}}`), '');
    console.log(`    `.repeat(currentIndent) + s);

    if (s.match(/\{\s*$/)) {
        ++currentIndent;
    }
}

/*
interface Type {
    // used for diagnostics only.
    toString(): string;

    // true if the internal stored representation is a pointer.
    isPointer(): boolean;

    // lifts a *native* JS value of this type to C expr.
    lift?(val: any): string;

    // C expr that evaluates to a JSValue for given C value of this type.
    //
    // valCode will appear exactly once in the generated code (same for other methods).
    // note that ctx is a variable *name*, so can occur multiple times.
    toJSValue?(ctx: string, valCode: string): string;

    // C expr that evaluates to a JSCFunctionListEntry for given C value of this type.
    // if missing, falls back to a runtime initialization.
    toJSDef?(name: string, valCode: string): string;

    // prints C code that declares a new variable of this type from given C value.
    declareFromC(ctx: string, name: string, valCode: string): void;

    // prints C code that declares a new variable of this type from given JSValue.
    declareFromJSValue(ctx: string, name: string, valCode: string): void;

    // C expr suitable for function arguments.
    // if missing it is simply a variable name.
    toArgument?(name: string): string;
}
*/

export class Type {
    constructor() {
        if (new.target === Type) throw 'Type cannot be constructed';
    }
}

export const undef = new class extends Type {
    toString() { return 'undefined'; }

    lift(val) { return `0`; } // dummy

    toJSValue(ctx, valCode) { return `JS_UNDEFINED`; }

    toJSDef(name, valCode) {
        if (valCode !== `0`) throw 'invalid C code for undefined';
        return `JS_PROP_UNDEFINED_DEF(${str(name)}, JS_PROP_ENUMERABLE)`; // ignore valCode
    }

    declareFromC(ctx, name, valCode) {
        throw 'undefined cannot be declared in C';
    }

    declareFromJSValue(ctx, name, valCode) {
        throw 'undefined cannot be declared in C';
    }

    toArgument(name) {
        throw 'undefined cannot be pass as an argument in C';
    }
};

export const bool = new class extends Type {
    toString() { return 'bool'; }

    lift(val) { return val ? `1` : `0`; }

    toJSValue(ctx, valCode) {
        if (valCode === `0`) return `JS_FALSE`;
        if (valCode === `1`) return `JS_TRUE`;
        return `JS_NewBool(${ctx}, !!(${valCode}))`;
    }

    declareFromC(ctx, name, valCode) {
        print(`bool ${name} = ${valCode};`);
    }

    declareFromJSValue(ctx, name, valCode) {
        let temp = newId('bool_declareFromValue');
        print(`bool ${name};`);
        print(`{`);
        print(`    int ${temp} = JS_ToBool(${ctx}, ${valCode})`);
        print(`    if (${temp} < 0) return JS_EXCEPTION;`);
        print(`    ${name} = (${temp} != 0);`);
        print(`}`);
    }
};

export const i32 = new class extends Type {
    toString() { return 'i32'; }

    lift(val) {
        val = Number(val);
        if (val !== val) throw 'not a number';
        return `(int32_t)${val}`;
    }

    toJSValue(ctx, valCode) { return `JS_NewInt32(${ctx}, ${valCode})`; }
    toJSDef(name, valCode) { return `JS_PROP_INT32_DEF(${str(name)}, ${valCode}, JS_PROP_ENUMERABLE)`; }

    declareFromJSValue(ctx, name, valCode) {
        print(`int32_t ${name};`);
        print(`if (JS_ToInt32(${ctx}, &${name}, ${valCode})) return JS_EXCEPTION;`);
    }
};

export const u8 = new class extends Type {
    toString() { return 'u8'; }

    lift(val) {
        val = Number(val);
        if (val !== val) throw 'not a number';
        return `(uint8_t)${val}`;
    }

    toJSValue(ctx, valCode) { return i32.toJSValue(ctx, `(uint8_t)(${valCode})`); }
    toJSDef(name, valCode) { return i32.toJSDef(name, `(uint8_t)(${valCode})`); }

    declareFromJSValue(ctx, name, valCode) {
        let id = newId('u8_declareFromValue');
        i32.declareFromJSValue(ctx, id, valCode);
        print(`uint8_t ${name} = ${id};`);
    }
};

export const u32 = new class extends Type {
    toString() { return 'u32'; }

    lift(val) {
        val = Number(val);
        if (val !== val) throw 'not a number';
        return `(uint32_t)${val}`;
    }

    // no JS_NewUint32
    toJSValue(ctx, valCode) { return `JS_NewInt64(${ctx}, (int64_t)(${valCode}))`; }

    declareFromJSValue(ctx, name, valCode) {
        print(`uint32_t ${name};`);
        print(`if (JS_ToUint32(${ctx}, &${name}, ${valCode})) return JS_EXCEPTION;`);
    }
};

// not nullable
export const char_p = new class extends Type {
    toString() { return 'non-null C string'; }

    lift(val) { return str(val.toString()); }

    toJSValue(ctx, valCode) { return `JS_NewString(${ctx}, ${valCode})`; }
    toJSDef(name, valCode) { return `JS_PROP_STRING_DEF(${str(name)}, ${valCode}, JS_PROP_ENUMERABLE)`; }

    declareFromJSValue(ctx, name, valCode) {
        print(`const char *${name} = JS_ToCString(${ctx}, ${valCode});`);
        print(`if (!${name}) return JS_ThrowTypeError(ctx, "string cannot be null");`);
    }
};

export class Option extends Type {
    constructor(ty) {
        this.ty = ty;
    }

    lift(val) {
        if (val === null) return `NULL`;
        return this.ty.lift(val);
    }

    toJSValue(ctx, valCode) {
        if (valCode === `NULL`) return `JS_NULL`;
        let id = newId('opt_toJSValue');
        print(`const char *${id} = ${valCode};`);
        if (ty.isNull) {
            return `${ty.isNull(id)} ? JS_NewString(${ctx}, ${id}) : JS_NULL`;
        } else {
        }
    }

    toJSDef(name, valCode) {
        return `JS_PROP_STRING_DEF(${str(name)}, ${valCode}, JS_PROP_ENUMERABLE)`;
    }

    declareFromJSValue(ctx, name, valCode) {
        let id = newId('char_p_or_null_declareFromValue');
        print(`JSValue ${id} = ${valCode};`);
        print(`const char *${name} = JS_IsNull(${id}) ? NULL : JS_ToCString(${ctx}, ${id});`);
    }
};

// args = [retTy, funcName, argTy1, argName1, ...]
// argTyK can be a string "this", in which case omitted from actual arguments
function declareFuncImpl(namespace, thisTy, args) {
    let [retTy, funcName] = args;
    let implFuncName = `js_${namespace}_${funcName}`;
    print(`static JSValue ${implFuncName}(`);
    print(`    JSContext *ctx,`);
    print(`    JSValueConst this_val,`);
    print(`    int argc,`);
    print(`    JSValueConst *argv`);
    print(`) {`);
    let argNames = [];
    for (let i = 2, argi = 0; i < args.length; ) {
        let argTy = args[i++];
        let argName = args[i++];
        if (argTy == 'this') {
            if (!thisTy) throw 'this in a non-method function';
            thisTy.declareFromJSValue(`ctx`, argName, `this_val`);
            if (thisTy.toArgument) argName = thisTy.toArgument(argName);
        } else {
            argTy.declareFromJSValue(`ctx`, argName, `argv[${argi++}]`);
            if (argTy.toArgument) argName = argTy.toArgument(argName);
        }
        argNames.push(argName);
    }
    print(`    return ${retTy.toJSValue(`ctx`, `${funcName}(${argNames.join(`, `)})`)};`);
    print(`}`);
    print();
    return `JS_CFUNC_DEF(${str(funcName)}, ${argNames.length}, ${implFuncName})`;
}

export class Module {
    constructor(name) {
        this.name = name;
        this.initFuncs = [];
        this.defs = [];
    }

    const(ty, constName, val) {
        if (!ty.toJSDef) throw 'type does not support const definition';
        if (val === undefined) {
            this.defs.push(ty.toJSDef(constName, constName));
        } else {
            if (!ty.lift) throw 'const can only be defined from a matching C code const';
            this.defs.push(ty.toJSDef(constName, ty.lift(val)));
        }
    }

    func(retTy, funcName/*, argTy1, argName1, ... */) {
        this.defs.push(declareFuncImpl(this.name, null, arguments));
    }

    init(f) {
        this.initFuncs.push(f);
    }

    get initFuncName() { return `js_${this.name}_init`; }

    done() {
        let exportFuncsList = `js_${this.name}_funcs`;
        print(`static const JSCFunctionListEntry ${exportFuncsList}[] = {`);
        for (let def of this.defs) {
            print(`${def},`);
        }
        print(`};`);
        print();

        print(`static int ${this.initFuncName}(JSContext *ctx, JSModuleDef *m) {`);
        for (let f of this.initFuncs) {
            f(`ctx`, `m`);
        }
        print(`    JS_SetModuleExportList(ctx, m, ${exportFuncsList}, ${exportFuncsList.length});`);
        print(`    return 0;`);
        print(`}`);
        print();
    }
}

export class Opaque extends Type {
    constructor(module, typeName, ptr, options) {
        super();

        if (!(ptr === '' || ptr === '*')) throw `new Opaque(${typeName}) with bad ptr = "${ptr}"`;
        options = options || {};

        let type_name = typeName.toLowerCase();

        this.module = module;
        this.typeName = typeName;
        this.type_name = type_name;
        this.ptr = ptr;
        this.wrappedTypeName = `JS${typeName.replace(/_/g, '')}`;
        this.classId = `js_${type_name}_class_id`;
        this.classDef = `js_${type_name}_class`;
        this.finalizer = options.finalizer || `(void)`;
        this.defs = [];

        print(`static JSClassID ${this.classId};`);
        print();
        print(`typedef struct { ${typeName} ${ptr}value; } ${this.wrappedTypeName};`);
        print();
        print(`static void js_${type_name}_finalizer(JSRuntime *rt, JSValue val) {`);
        print(`    ${this.wrappedTypeName} *opaque = JS_GetOpaque(val, ${this.classId});`);
        print(`    ${this.finalizer}(opaque->value);`);
        print(`    if (opaque) js_free_rt(rt, opaque);`);
        print(`}`);
        print();
        print(`static JSClassDef ${this.classDef} = {`);
        print(`    ${str(typeName)},`);
        print(`    .finalizer = js_${type_name}_finalizer,`);
        print(`};`);
        print();
        print(`static ${typeName} *js_${type_name}_get(JSContext *ctx, JSValueConst obj) {`);
        print(`    ${this.wrappedTypeName} *opaque = JS_GetOpaque2(ctx, obj, ${this.classId});`);
        print(`    if (!opaque) return NULL;`);
        if (ptr) {
            print(`if (!opaque->value) {`);
            print(`    JS_ThrowInternalError(ctx, "Invalid " ${str(typeName)});`);
            print(`    return NULL;`);
            print(`}`);
        }
        print(`    return ${ptr ? `` : `&`}opaque->value;`);
        print(`}`);
        print();
        print(`static JSValue js_new_${type_name}(JSContext *ctx, ${typeName} *value) {`);
        print(`    JSValue js_value = JS_NewObjectClass(ctx, ${this.classId});`);
        print(`    if (JS_IsException(js_value)) return js_value;`);
        print(`    ${this.wrappedTypeName} *opaque = js_mallocz(ctx, sizeof(*opaque));`);
        print(`    if (!opaque) {`);
        print(`        JS_FreeValue(ctx, js_value);`);
        print(`        return JS_EXCEPTION;`);
        print(`    }`);
        print(`    opaque->value = ${ptr ? `` : `*`}value;`);
        print(`    JS_SetOpaque(js_value, opaque);`);
        print(`    return js_value;`);
        print(`}`);
        print();
    }

    prop(ty, propName, getterFunc, setterFunc) {
        let getterImplName = `js_${this.type_name}_${propName}_getter`;
        let setterImplName = `js_${this.type_name}_${propName}_setter`;

        if (getterFunc) {
            print(`static JSValue ${getterImplName}(`);
            print(`    JSContext *ctx,`);
            print(`    JSValueConst this_val`);
            print(`) {`);
            print(`    ${this.typeName} *base = js_${this.type_name}_get(ctx, this_val);`);
            print(`    if (!base) return JS_EXCEPTION;`);
            if (getterFunc === true) {
                print(`return ${ty.toJSValue(`ctx`, `base->${propName}`)};`);
            } else {
                print(`return ${ty.toJSValue(`ctx`, `${getterFunc}(base)`)};`);
            }
            print(`}`);
            print();
        }

        if (setterFunc) {
            print(`static JSValue ${setterImplName}(`);
            print(`    JSContext *ctx,`);
            print(`    JSValueConst this_val,`);
            print(`    JSValueConst val`);
            print(`) {`);
            print(`    ${this.typeName} *base = js_${this.type_name}_get(ctx, this_val);`);
            print(`    if (!base) return JS_EXCEPTION;`);
            ty.declareFromJSValue(`ctx`, `value`, `val`);
            let value = ty.toArgument ? ty.toArgument(`value`) : `value`;
            if (setterFunc === true) {
                print(`base->${propName} = ${value};`);
                print(`return JS_UNDEFINED;`);
            } else {
                print(`${setterFunc}(base, ${value});`);
                print(`return JS_UNDEFINED;`); // TODO should be able to return error
            }
            print(`}`);
            print();
        }

        this.defs.push(`JS_CGETSET_DEF(${str(propName)}, ${getterFunc ? getterImplName : `NULL`}, ${setterFunc ? setterImplName : `NULL`})`);
    }

    method(retTy, funcName/*, argTy1, argName1, ... */) {
        this.defs.push(declareFuncImpl(this.module.name, this, arguments));
    }

    done() {
        let protoFuncsList = `js_${this.type_name}_proto_funcs`;
        print(`static const JSCFunctionListEntry ${protoFuncsList}[] = {`);
        for (let def of this.defs) {
            print(`${def},`);
        }
        print(`};`);
        print();

        this.module.init((ctx, m) => {
            print(`{`);
            print(`    JS_NewClassID(&${this.classId});`);
            print(`    JS_NewClass(JS_GetRuntime(${ctx}), ${this.classId}, &${this.classDef});`);
            print(`    JSValue proto = JS_NewObject(${ctx});`);
            print(`    JS_SetPropertyFunctionList(${ctx}, proto, ${protoFuncsList}, ${this.defs.length});`);
            print(`    JS_SetClassProto(${ctx}, ${this.classId}, proto);`);
            print(`}`);
        });
    }

    toJSValue(ctx, valCode) {
        if (this.ptr) {
            return `js_new_${this.type_name}(${ctx}, ${valCode})`;
        } else {
            return `js_new_${this.type_name}(${ctx}, &(${valCode}))`;
        }
    }

    declareFromJSValue(ctx, name, valCode) {
        print(`${this.typeName} *${name} = js_${this.type_name}_get(${ctx}, ${valCode});`);
        print(`if (!${name}) return JS_EXCEPTION;`);
    }

    toArgument(name) {
        return this.ptr ? name : `*` + name;
    }
}

// POD struct, represented as an object in JS
export class Struct extends Type {
    constructor(module, typeName/*, fieldTy1, fieldName1, ... */) {
        super();

        options = options || {};

        let struct = '';
        let bareTypeName = typeName;
        if (typeName.match(/^struct\s/)) {
            struct = 'struct ';
            bareTypeName = bareTypeName.substr(6).trim();
        }

        let type_name = bareTypeName.toLowerCase();

        this.module = module;
        this.struct = struct;
        this.typeName = typeName;
        this.type_name = type_name;

        print(`static ${typeName} *js_${type_name}_get(JSContext *ctx, JSValueConst value) {`);
        let fields = [];
        for (let i = 2; i < arguments.length; ) {
            let fieldTy = arguments[i++];
            let fieldName = arguments[i++];
            fieldTy.declareFromJSValue(`ctx`, fieldName, `JS_GetPropertyStr(ctx, value, ${str(argName)})`);
            if (fieldTy.toArgument) fieldName = fieldTy.toArgument(fieldName);
            fields.push({fieldName, fieldTy});
        }
        /*
        print(`    ${typeName} value = {0};`);
        for (let {fieldName, fieldTy} of fields) {
            print(`value.
        }
        print(`    ${typeName} value = {0};`);
        */

        print(`    ${this.wrappedTypeName} *opaque = JS_GetOpaque2(ctx, obj, ${this.classId});`);
        print(`    if (!opaque) return NULL;`);
        if (ptr) {
            print(`if (!opaque->value) {`);
            print(`    JS_ThrowInternalError(ctx, "Invalid " ${str(typeName)});`);
            print(`    return NULL;`);
            print(`}`);
        }
        print(`    return ${ptr ? `` : `&`}opaque->value;`);
        print(`}`);
        print();
        print(`static JSValue js_new_${type_name}(JSContext *ctx, const ${typeName} *value) {`);
        print(`    JSValue js_value = JS_NewObjectClass(ctx, ${this.classId});`);
        print(`    if (JS_IsException(js_value)) return js_value;`);
        print(`    ${this.wrappedTypeName} *opaque = js_mallocz(ctx, sizeof(*opaque));`);
        print(`    if (!opaque) {`);
        print(`        JS_FreeValue(ctx, js_value);`);
        print(`        return JS_EXCEPTION;`);
        print(`    }`);
        print(`    opaque->value = ${ptr ? `` : `*`}value;`);
        print(`    JS_SetOpaque(js_value, opaque);`);
        print(`    return js_value;`);
        print(`}`);
        print();
    }

    prop(ty, propName, getterFunc, setterFunc) {
        let getterImplName = `js_${this.type_name}_${propName}_getter`;
        let setterImplName = `js_${this.type_name}_${propName}_setter`;

        if (getterFunc) {
            print(`static JSValue ${getterImplName}(`);
            print(`    JSContext *ctx,`);
            print(`    JSValueConst this_val`);
            print(`) {`);
            print(`    ${this.typeName} *base = js_${this.type_name}_get(ctx, this_val);`);
            print(`    if (!base) return JS_EXCEPTION;`);
            if (getterFunc === true) {
                print(`return ${ty.toJSValue(`ctx`, `base->${propName}`)};`);
            } else {
                print(`return ${ty.toJSValue(`ctx`, `${getterFunc}(base)`)};`);
            }
            print(`}`);
            print();
        }

        if (setterFunc) {
            print(`static JSValue ${setterImplName}(`);
            print(`    JSContext *ctx,`);
            print(`    JSValueConst this_val,`);
            print(`    JSValueConst val`);
            print(`) {`);
            print(`    ${this.typeName} *base = js_${this.type_name}_get(ctx, this_val);`);
            print(`    if (!base) return JS_EXCEPTION;`);
            ty.declareFromJSValue(`ctx`, `value`, `val`);
            let value = ty.toArgument ? ty.toArgument(`value`) : `value`;
            if (setterFunc === true) {
                print(`base->${propName} = ${value};`);
                print(`return JS_UNDEFINED;`);
            } else {
                print(`${setterFunc}(base, ${value});`);
                print(`return JS_UNDEFINED;`); // TODO should be able to return error
            }
            print(`}`);
            print();
        }

        this.defs.push(`JS_CGETSET_DEF(${str(propName)}, ${getterFunc ? getterImplName : `NULL`}, ${setterFunc ? setterImplName : `NULL`})`);
    }

    method(retTy, funcName/*, argTy1, argName1, ... */) {
        this.defs.push(declareFuncImpl(this.module.name, this, arguments));
    }

    done() {
        let protoFuncsList = `js_${this.type_name}_proto_funcs`;
        print(`static const JSCFunctionListEntry ${protoFuncsList}[] = {`);
        for (let def of this.defs) {
            print(`${def},`);
        }
        print(`};`);
        print();

        this.module.init((ctx, m) => {
            print(`{`);
            print(`    JS_NewClassID(&${this.classId});`);
            print(`    JS_NewClass(JS_GetRuntime(${ctx}), ${this.classId}, &${this.classDef});`);
            print(`    JSValue proto = JS_NewObject(${ctx});`);
            print(`    JS_SetPropertyFunctionList(${ctx}, proto, ${protoFuncsList}, ${this.defs.length});`);
            print(`    JS_SetClassProto(${ctx}, ${this.classId}, proto);`);
            print(`}`);
        });
    }

    toJSValue(ctx, valCode) {
        if (this.ptr) {
            return `js_new_${this.type_name}(${ctx}, ${valCode})`;
        } else {
            return `js_new_${this.type_name}(${ctx}, &(${valCode}))`;
        }
    }

    declareFromJSValue(ctx, name, valCode) {
        print(`${this.typeName} *${name} = js_${this.type_name}_get(${ctx}, ${valCode});`);
        print(`if (!${name}) return JS_EXCEPTION;`);
    }

    toArgument(name) {
        return this.ptr ? name : `*` + name;
    }
}

