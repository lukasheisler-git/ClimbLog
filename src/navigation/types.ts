import { NavigatorScreenParams } from '@react-navigation/native';

export type HangboardStackParamList = {
  HangboardHome: undefined;
  WorkoutEditor: { workoutId?: string };
  Timer:         { workoutId: string };
};

export type ClimbLogStackParamList = {
  ClimbLogHome:   undefined;
  AddRoute:       { routeId?: string };
  ClimbLogSearch: undefined;
  ClimbLogStats:  undefined;
};

export type AppTabParamList = {
  HomeTab:      undefined;
  ClimbLogTab:  NavigatorScreenParams<ClimbLogStackParamList>;
  HangboardTab: NavigatorScreenParams<HangboardStackParamList>;
  TrainingTab:  undefined;
};
