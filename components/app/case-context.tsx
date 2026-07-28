"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  useContext,
  useMemo,
  useReducer,
  useState,
} from "react";

import { createEmptyApplicantCase } from "@/lib/case/empty";
import { caseReducer } from "@/lib/case/reducer";
import { syntheticApplicant } from "@/lib/case/seed";
import type {
  ApplicantCase,
  CaseAction,
  SupportedLocale,
} from "@/lib/case/types";

interface CaseContextValue {
  applicantCase: ApplicantCase;
  dispatch: Dispatch<CaseAction>;
  loadDemo: (locale?: SupportedLocale) => void;
  setVoiceSessionActive: (active: boolean) => void;
  voiceSessionActive: boolean;
}

const CaseContext = createContext<CaseContextValue | null>(null);

export function CaseProvider({
  children,
  initialCase,
}: {
  children: ReactNode;
  initialCase?: ApplicantCase;
}) {
  const [applicantCase, dispatch] = useReducer(
    caseReducer,
    initialCase,
    (source) => (source ? structuredClone(source) : createEmptyApplicantCase()),
  );
  const [voiceSessionActive, setVoiceSessionActive] = useState(false);

  const value = useMemo(
    () => ({
      applicantCase,
      dispatch,
      loadDemo: (
        locale = applicantCase.conversationLocale ?? "en-US",
      ) => {
        const demoCase = structuredClone(syntheticApplicant);
        demoCase.conversationLocale = locale;
        demoCase.applicant.preferredLanguage.value =
          locale === "es-US"
            ? "Spanish"
            : locale === "zh-CN"
              ? "Chinese (Mandarin)"
              : "English";
        dispatch({
          type: "LOAD_CASE",
          applicantCase: demoCase,
        });
      },
      setVoiceSessionActive,
      voiceSessionActive,
    }),
    [applicantCase, voiceSessionActive],
  );

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}

export function useApplicantCase(): CaseContextValue {
  const value = useContext(CaseContext);
  if (!value) {
    throw new Error("useApplicantCase must be used inside CaseProvider");
  }
  return value;
}
