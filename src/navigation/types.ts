import type { NavigatorScreenParams } from '@react-navigation/native';
import type { HistoryEntry } from '../hooks/useGameHistory';

export type GameStackParamList = {
  Game: { loadEntry?: HistoryEntry } | undefined;
};

export type HistoryStackParamList = {
  HistoryList: undefined;
  HistoryDetail: { entry: import('../hooks/useGameHistory').HistoryEntry };
};

export type RootTabParamList = {
  GameTab: NavigatorScreenParams<GameStackParamList>;
  HistoryTab: NavigatorScreenParams<HistoryStackParamList>;
};
