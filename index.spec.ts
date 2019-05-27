import { Serializable, SerializableAttr, serialize, NonSerialized } from '.';

describe('ts-serialize', () => {
  @Serializable()
  class A {
    @SerializableAttr({transformer: id => Buffer.from(id).toString('base64')})
    id: string;
    @SerializableAttr({level: 'protected'})
    attr1: boolean;
    attr2: boolean;
    @NonSerialized()
    attr3: boolean;
    @NonSerialized()
    @SerializableAttr({level: 'protected'})
    attr4: boolean;
    constructor(data: any) {
      Object.keys(data).forEach(k => (this as any)[k] = data[k]);
    }
  }

  it('should serialize correctly', () => {
    expect(JSON.parse(serialize(new A({id: '1', attr1: '2', attr2: '3'}))))
      .toEqual({id: 'MQ==', attr2: '3'});
  });
  it('should handle non-serialized correctly', () => {
    expect(JSON.parse(serialize(new A({attr3: '111', attr4: 'non-serialized'}))))
      .toEqual({});
    expect(JSON.parse(serialize(new A({attr3: '111', attr4: 'non-serialized'}), {level: 'protected'})))
      .toEqual({});
  });
  it('should handle serialize level correctly', () => {
    expect(JSON.parse(serialize(new A({id: '1', attr1: '2', attr2: '3'}), {level: 'protected'})))
      .toEqual({id: 'MQ==', attr1: '2', attr2: '3'});
  });
});

describe('strict mode', () => {
  @Serializable({strict: true})
  class A {
    @SerializableAttr({})
    attr1: boolean;
    attr2: boolean;
    constructor(data: any) {
      Object.keys(data).forEach(k => (this as any)[k] = data[k]);
    }
  }
  it('should serialize only fields which declared explict', () => {
    expect(JSON.parse(serialize(new A({attr1: '2', attr2: '3'}), {level: 'protected'})))
      .toEqual({attr1: '2'});
  })
})
