import clFlag from 'flag-icons/flags/4x3/cl.svg?url';
import cnFlag from 'flag-icons/flags/4x3/cn.svg?url';
import gbFlag from 'flag-icons/flags/4x3/gb.svg?url';
import jpFlag from 'flag-icons/flags/4x3/jp.svg?url';

export type LanguageId = 'es-cl' | 'en' | 'ja' | 'zh';

export type LanguageDataItem = {
    id: LanguageId;
    flag: string;
    level: number;
};

// Global (non-translated) data: ordering + levels.
export const languageData: LanguageDataItem[] = [
    { id: 'es-cl', flag: clFlag, level: 100 },
    { id: 'en', flag: gbFlag, level: 45 },
    { id: 'ja', flag: jpFlag, level: 10 },
    { id: 'zh', flag: cnFlag, level: 0.1 },
];
