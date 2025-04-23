export type Server = {
  serverId: string;
  serverName: string;
};

export type Character = {
  serverId: Server['serverId'];
  characterId: string;
  characterName: string;
  level: number;
  jobId: string;
  jobGrowId: string;
  jobName: string;
  jobGrowName: string;
  fame: number;
};
