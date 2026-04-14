export class DepencyInjection {
   private static instance: DepencyInjection
   private container: Map<string, any> = new Map()

   private constructor() { }

   public static getInstance(): DepencyInjection {
      if (!DepencyInjection.instance) {
         DepencyInjection.instance = new DepencyInjection()
      }

      return DepencyInjection.instance;
   }

   public register<T>(type: () => T): T {
      const instance = type() as T & { constructor: { name: string } }
      this.container.set(instance.constructor.name, instance)
      return instance
   }

   public resolve<T>(type: new (...args: any[]) => T): T {
      return this.container.get(type.name)
   }
}