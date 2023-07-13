import { Context } from '@nuxt/types';
import Dolphin from '@/server/Dolphin/Dolphin';

declare module '@nuxt/types' {
  interface NuxtAppOptions {
    $dolphin: Dolphin;
  }
}

const dolphinPlugin = async (context: Context, inject: any) => {
  const mongoDbUrl = 'mongodb://your-mongodb-url';
  const dbName = 'your-database-name';

  new Dolphin(mongoDbUrl, dbName, (dolphin, success, error) => {
    if (success) {
      inject('dolphin', dolphin);
      context.app.$dolphin = dolphin;
    } else {
      console.error('Error initializing Dolphin:', error);
    }
  });
};

export default dolphinPlugin;
