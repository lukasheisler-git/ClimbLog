import { NavigatorScreenParams } from '@react-navigation/native';
import { Weekday } from '../types/plan';

export type HangboardStackParamList = {
  HangboardHome: undefined;
  WorkoutEditor: { workoutId?: string };
  Timer:         { workoutId: string };
};

export type ClimbLogTabKey = 'Begehungen' | 'Suche' | 'Statistik';

export type ClimbLogStackParamList = {
  ClimbLogMain: { initialTab?: ClimbLogTabKey };
  AddRoute:     { routeId?: string };
  RouteDetail:  { routeId: string };
};

export type TrainingStackParamList = {
  TrainingMain:   undefined;
  SessionEditor:  { sessionId?: string; templateId?: string };
  SessionDetail:  { sessionId: string };
  DayEditor:      { weekday: Weekday };
  PlanEditor:     { planId?: string };
};

export type AppTabParamList = {
  HomeTab:      undefined;
  ClimbLogTab:  NavigatorScreenParams<ClimbLogStackParamList>;
  HangboardTab: NavigatorScreenParams<HangboardStackParamList>;
  TrainingTab:  NavigatorScreenParams<TrainingStackParamList>;
};
