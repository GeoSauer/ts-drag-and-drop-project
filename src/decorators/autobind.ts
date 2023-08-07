namespace App {
  export function AutoBind(_: any, _2: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjustedDescriptor: PropertyDescriptor = {
      configurable: true,
      enumerable: false,
      get() {
        const boundFunction = originalMethod.bind(this);
        return boundFunction;
      },
    };
    return adjustedDescriptor;
  }
}
