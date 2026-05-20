import { NavigatorScreenParams } from '@react-navigation/native';

export type HangboardStackParamList = {
  HangboardHome: undefined;
  WorkoutEditor: { workoutId?: string };
  Timer: { workoutId: string };
};

export type AppTabParamList = {
  HomeTab:      undefined;
  ClimbLogTab:  undefined;
  HangboardTab: NavigatorScreenParams<HangboardStackParamList>;
  TrainingTab:  undefined;
};
