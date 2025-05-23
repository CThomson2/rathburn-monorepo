import { Database } from '@rathburn/types';

// Then use the enum like this:
type ActionType = Database['inventory']['Enums']['action_type'];
type BatchType = Database['inventory']['Enums']['batch_type'];
type DrumStatus = Database['inventory']['Enums']['drum_status'];

export type { ActionType, BatchType, DrumStatus };