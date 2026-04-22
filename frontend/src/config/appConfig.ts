import appConfig from './app-config.json';

export interface AppConfig {
  appName: string;
  themeStorageKey: string;
  titleSuffix: string;
  appDescription: string;
}

export const CONFIG: AppConfig = appConfig as AppConfig;

export default CONFIG;
