import type { NavigatorScreenParams } from '@react-navigation/native';

export type GameStackParamList = {
  Game: undefined;
};

export type HistoryStackParamList = {
  HistoryList: undefined;
  HistoryDetail: { entry: import('../hooks/useGameHistory').HistoryEntry };
};

export type RootTabParamList = {
  GameTab: NavigatorScreenParams<GameStackParamList>;
  HistoryTab: NavigatorScreenParams<HistoryStackParamList>;
};
