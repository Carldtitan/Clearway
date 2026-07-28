"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  useContext,
  useMemo,
  useReducer,
} from "react";

import { createEmptyApplicantCase } from "@/lib/case/empty";
import { caseReducer } from "@/lib/case/reducer";
import { syntheticApplicant } from "@/lib/case/seed";
import type { ApplicantCase, CaseAction } from "@/lib/case/types";

interface CaseContextValue {
  applicantCase: ApplicantCase;
  dispatch: Dispatch<CaseAction>;
  loadDemo: () => void;
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

  const value = useMemo(
    () => ({
      applicantCase,
      dispatch,
      loadDemo: () =>
        dispatch({
          type: "LOAD_CASE",
          applicantCase: structuredClone(syntheticApplicant),
        }),
    }),
    [applicantCase],
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
