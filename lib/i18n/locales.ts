import type { SupportedLocale } from "@/lib/case/types";

export interface LocaleDefinition {
  id: SupportedLocale;
  nativeLabel: string;
  shortLabel: string;
  preferredLanguageValue: string;
  speechRecognitionLanguage: string;
  deepgramModel: "nova-3-medical" | "nova-3";
  deepgramLanguage: "en-US" | "es" | "zh-CN";
}

export const SUPPORTED_LOCALES: readonly LocaleDefinition[] = [
  {
    id: "en-US",
    nativeLabel: "English",
    shortLabel: "EN",
    preferredLanguageValue: "English",
    speechRecognitionLanguage: "en-US",
    deepgramModel: "nova-3-medical",
    deepgramLanguage: "en-US",
  },
  {
    id: "es-US",
    nativeLabel: "Español",
    shortLabel: "ES",
    preferredLanguageValue: "Spanish",
    speechRecognitionLanguage: "es-US",
    deepgramModel: "nova-3",
    deepgramLanguage: "es",
  },
  {
    id: "zh-CN",
    nativeLabel: "中文（普通话）",
    shortLabel: "中文",
    preferredLanguageValue: "Chinese (Mandarin)",
    speechRecognitionLanguage: "zh-CN",
    deepgramModel: "nova-3",
    deepgramLanguage: "zh-CN",
  },
] as const;

export const DEFAULT_LOCALE: SupportedLocale = "en-US";

export type LocalizedText = Record<SupportedLocale, string>;

export const copy = {
  languageQuestion: {
    "en-US": "Which language would you like to use?",
    "es-US": "¿Qué idioma prefiere usar?",
    "zh-CN": "您想使用哪种语言？",
  },
  productDescription: {
    "en-US":
      "Prepare your SSDI application and organize the supporting records through a guided conversation.",
    "es-US":
      "Prepare su solicitud de SSDI y organice los expedientes de respaldo mediante una conversación guiada.",
    "zh-CN": "通过引导式对话准备您的 SSDI 申请并整理相关证明材料。",
  },
  introduction: {
    "en-US":
      "Hi, I’m Formless. I’ll help you prepare your disability application and keep track of the records Social Security may need. Before we begin, please have your Social Security number, proof of birth, photo ID, work history, medical provider information, medication list, and bank details nearby. If you do not have something, tell me and I’ll keep track of it. Say “I’m ready” when you want to begin.",
    "es-US":
      "Hola, soy Formless. Le ayudaré a preparar su solicitud por discapacidad y a llevar un control de los expedientes que el Seguro Social podría necesitar. Antes de comenzar, tenga cerca su número de Seguro Social, comprobante de nacimiento, identificación con foto, historial de trabajo, información de sus proveedores médicos, lista de medicamentos y datos bancarios. Si no tiene algo, dígamelo y lo anotaré para después. Diga “Estoy listo” o “Estoy lista” cuando quiera comenzar.",
    "zh-CN":
      "您好，我是 Formless。我会帮助您准备残障福利申请，并记录社会保障局可能需要的材料。开始之前，请尽量准备好您的社会安全号码、出生证明、带照片的身份证件、工作经历、医疗机构信息、药物清单和银行资料。如果有材料暂时没有，请告诉我，我会记录下来。准备好后，请说“我准备好了”。",
  },
  preparing: {
    "en-US": "What to have nearby",
    "es-US": "Tenga esto cerca",
    "zh-CN": "请准备这些资料",
  },
  readyPrompt: {
    "en-US": "Say “I’m ready” when you want to begin.",
    "es-US": "Diga “Estoy listo” o “Estoy lista” cuando quiera comenzar.",
    "zh-CN": "准备好后，请说“我准备好了”。",
  },
  typeAnswer: {
    "en-US": "Type my answer",
    "es-US": "Escribir mi respuesta",
    "zh-CN": "输入我的回答",
  },
  sendAnswer: {
    "en-US": "Send answer",
    "es-US": "Enviar respuesta",
    "zh-CN": "提交回答",
  },
  listen: {
    "en-US": "Listening",
    "es-US": "Escuchando",
    "zh-CN": "正在聆听",
  },
  processing: {
    "en-US": "Checking what I heard",
    "es-US": "Revisando lo que escuché",
    "zh-CN": "正在核对您的回答",
  },
  yourAnswer: {
    "en-US": "Your answer",
    "es-US": "Su respuesta",
    "zh-CN": "您的回答",
  },
  application: {
    "en-US": "Application",
    "es-US": "Solicitud",
    "zh-CN": "申请",
  },
  documents: {
    "en-US": "Documents",
    "es-US": "Documentos",
    "zh-CN": "文件",
  },
  records: {
    "en-US": "Records",
    "es-US": "Expedientes",
    "zh-CN": "医疗记录",
  },
  answerConfirmed: {
    "en-US": "Got it. I’ll use that answer.",
    "es-US": "Entendido. Usaré esa respuesta.",
    "zh-CN": "好的，我会使用这个回答。",
  },
  answerNotConfirmed: {
    "en-US": "I won’t save that.",
    "es-US": "No guardaré esa respuesta.",
    "zh-CN": "我不会保存这个回答。",
  },
  correctionPrompt: {
    "en-US":
      "Thanks for catching that. I won’t save it. What should I put down instead?",
    "es-US":
      "Gracias por corregirme. No guardaré eso. ¿Qué debo anotar en su lugar?",
    "zh-CN":
      "谢谢您纠正我。我不会保存刚才的内容。请告诉我应该改成什么。",
  },
  correctionAcknowledged: {
    "en-US": "Thanks for correcting me. Let me make sure I have it now.",
    "es-US": "Gracias por corregirme. Déjeme confirmar que ahora lo entendí.",
    "zh-CN": "谢谢您纠正我。让我确认这次是否听对了。",
  },
  requiredCannotSkip: {
    "en-US":
      "This answer is required for the application. We can come back to it, but the documents cannot be created until it is resolved.",
    "es-US":
      "Esta respuesta es necesaria para la solicitud. Podemos volver a ella después, pero no se podrán crear los documentos hasta resolverla.",
    "zh-CN":
      "申请需要这个回答。我们可以稍后再回答，但在解决之前无法生成申请文件。",
  },
  sessionPaused: {
    "en-US": "The conversation is paused.",
    "es-US": "La conversación está en pausa.",
    "zh-CN": "对话已暂停。",
  },
  allQuestionsAnswered: {
    "en-US":
      "We have reached the review. I’ll identify anything that still needs your attention before creating documents.",
    "es-US":
      "Hemos llegado a la revisión. Identificaré lo que aún necesita su atención antes de crear los documentos.",
    "zh-CN": "现在进入核对环节。生成文件前，我会指出仍需您处理的事项。",
  },
  fillDemo: {
    "en-US": "Fill demo application",
    "es-US": "Completar solicitud de demostración",
    "zh-CN": "填充演示申请",
  },
  demoShort: {
    "en-US": "Demo",
    "es-US": "Demo",
    "zh-CN": "演示",
  },
  demoReplaceTitle: {
    "en-US": "Replace this application with the demo case?",
    "es-US": "¿Reemplazar esta solicitud con el caso de demostración?",
    "zh-CN": "要用演示案例替换当前申请吗？",
  },
  demoReplaceDescription: {
    "en-US":
      "Your answers from this session will be removed and replaced with Elena Rivera’s complete synthetic application.",
    "es-US":
      "Sus respuestas de esta sesión se eliminarán y se reemplazarán con la solicitud sintética completa de Elena Rivera.",
    "zh-CN":
      "本次会话中的回答将被删除，并替换为 Elena Rivera 的完整虚构申请。",
  },
  keepAnswers: {
    "en-US": "Keep my answers",
    "es-US": "Conservar mis respuestas",
    "zh-CN": "保留我的回答",
  },
  loadDemoCase: {
    "en-US": "Load demo case",
    "es-US": "Cargar caso de demostración",
    "zh-CN": "加载演示案例",
  },
  demoLoaded: {
    "en-US": "Demo case loaded",
    "es-US": "Caso de demostración cargado",
    "zh-CN": "演示案例已加载",
  },
  demoReadyTitle: {
    "en-US": "Elena Rivera’s application is complete.",
    "es-US": "La solicitud de Elena Rivera está completa.",
    "zh-CN": "Elena Rivera 的申请已完成。",
  },
  demoReadyDescription: {
    "en-US":
      "The synthetic case includes her work history, disabling conditions, treatment sources, medications, medical test, and record follow-up status.",
    "es-US":
      "El caso sintético incluye su historial laboral, condiciones discapacitantes, fuentes de tratamiento, medicamentos, prueba médica y estado de seguimiento de expedientes.",
    "zh-CN":
      "该虚构案例包括工作经历、致残状况、治疗来源、药物、医学检查和病历跟进状态。",
  },
  continueDocuments: {
    "en-US": "Continue to documents",
    "es-US": "Continuar a documentos",
    "zh-CN": "继续生成文件",
  },
} satisfies Record<string, LocalizedText>;

export const preparationItems: Array<{
  id: string;
  label: LocalizedText;
}> = [
  {
    id: "ssn",
    label: {
      "en-US": "Social Security number",
      "es-US": "Número de Seguro Social",
      "zh-CN": "社会安全号码",
    },
  },
  {
    id: "birth-certificate",
    label: {
      "en-US": "Proof of birth",
      "es-US": "Comprobante de nacimiento",
      "zh-CN": "出生证明",
    },
  },
  {
    id: "photo-id",
    label: {
      "en-US": "Photo ID",
      "es-US": "Identificación con foto",
      "zh-CN": "带照片的身份证件",
    },
  },
  {
    id: "work-history",
    label: {
      "en-US": "Work history",
      "es-US": "Historial de trabajo",
      "zh-CN": "工作经历",
    },
  },
  {
    id: "medical-providers",
    label: {
      "en-US": "Medical provider information",
      "es-US": "Información de proveedores médicos",
      "zh-CN": "医疗机构信息",
    },
  },
  {
    id: "medications",
    label: {
      "en-US": "Medication list",
      "es-US": "Lista de medicamentos",
      "zh-CN": "药物清单",
    },
  },
  {
    id: "banking",
    label: {
      "en-US": "Bank details",
      "es-US": "Datos bancarios",
      "zh-CN": "银行资料",
    },
  },
];

export function localeDefinition(locale: SupportedLocale): LocaleDefinition {
  return (
    SUPPORTED_LOCALES.find((candidate) => candidate.id === locale) ??
    SUPPORTED_LOCALES[0]
  );
}

export function localized(
  value: LocalizedText,
  locale: SupportedLocale | null,
): string {
  return value[locale ?? DEFAULT_LOCALE];
}
