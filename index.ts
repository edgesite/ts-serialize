import 'reflect-metadata';

interface SerializableAttrOptions {
  level?: string | symbol;
  transformer?: (value: any) => any;
}

interface SerializationOptions {
  // if strict mode is enable, only @SerializableAttr will be emit.
  strict?: boolean;
}

type ISerializeInfo = SerializationOptions & {
  fields: { [key: string]: SerializableAttrOptions };
};

const SerializeInfo = Symbol('SerializeInfo');

const getMetadata = (target: object): ISerializeInfo | undefined => {
  return Reflect.getMetadata(SerializeInfo, target);
}

const getMetadataOrNew = (target: object) => {
  let info = getMetadata(target);
  if (info === undefined) {
    info = { fields: {} };
    Reflect.defineMetadata(SerializeInfo, info, target);
  }
  return info!;
}

export const Serializable = (options: SerializationOptions = {}): ClassDecorator => {
  return (target) => {
    const info = getMetadataOrNew(target);
    simpleMerge(info, options);
    return target;
  }
}

const simpleMerge = (dst: any, src: any) => {
  Object.keys(src).forEach(k => {
    if (src[k] !== undefined) dst[k] = src[k];
  });
}

export const SerializableAttr = (options: SerializableAttrOptions = {}): PropertyDecorator => {
  return (target, key: string) => {
    getMetadataOrNew(target.constructor).fields[key] = options;
  }
}

const NonSerializedSymbol = Symbol('NonSerializedSymbol');

export const NonSerialized = () => SerializableAttr({level: NonSerializedSymbol});

interface SerializeOptions {
  level?: string;
}

export const serialize = (object: any, options: SerializeOptions = {}) => {
  const info = getMetadata(object.constructor);
  const getReplacer = () => {
    if (!info) return null;
    return ((key: string, value: string) => {
      if (key === '') return value;
      const field = info.fields[key];
      if (field) {
        if (field.level !== undefined && field.level !== options.level) return undefined;
        return field.transformer ? field.transformer(value) : value;
      } else if (!info.strict) {
        return value;
      }
    });
  }
  return JSON.stringify(object, getReplacer() as any);
}
