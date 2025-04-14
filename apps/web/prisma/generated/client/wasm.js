
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.Active_contextScalarFieldEnum = {
  context_id: 'context_id',
  worker_id: 'worker_id',
  still_id: 'still_id',
  created_at: 'created_at'
};

exports.Prisma.Auth_activity_logScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  action: 'action',
  ip_address: 'ip_address',
  metadata: 'metadata',
  created_at: 'created_at'
};

exports.Prisma.Bottle_sizesScalarFieldEnum = {
  id: 'id',
  volume: 'volume'
};

exports.Prisma.Chemical_group_kindScalarFieldEnum = {
  value: 'value'
};

exports.Prisma.Distillation_pending_assignmentScalarFieldEnum = {
  pending_id: 'pending_id',
  drum_id: 'drum_id',
  transport_id: 'transport_id',
  assigned_distillation_id: 'assigned_distillation_id',
  status: 'status'
};

exports.Prisma.Distillation_recordScalarFieldEnum = {
  record_id: 'record_id',
  distillation_id: 'distillation_id',
  actual_start: 'actual_start',
  actual_end: 'actual_end',
  status: 'status',
  notes: 'notes'
};

exports.Prisma.Distillation_scheduleScalarFieldEnum = {
  distillation_id: 'distillation_id',
  scheduled_date: 'scheduled_date',
  still_id: 'still_id',
  expected_drum_qty: 'expected_drum_qty',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Distillation_schedule_itemsScalarFieldEnum = {
  details_id: 'details_id',
  distillation_id: 'distillation_id',
  new_stock_id: 'new_stock_id',
  repro_stock_id: 'repro_stock_id',
  drum_quantity: 'drum_quantity',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.DrumsScalarFieldEnum = {
  old_id: 'old_id',
  material: 'material',
  batch_code: 'batch_code',
  id: 'id',
  supplier: 'supplier',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at',
  site: 'site',
  date_ordered: 'date_ordered',
  chemical_group: 'chemical_group',
  material_code: 'material_code'
};

exports.Prisma.Log_drum_decommissionScalarFieldEnum = {
  decommission_id: 'decommission_id',
  drum_id: 'drum_id',
  decommissioned_at: 'decommissioned_at',
  worker_id: 'worker_id'
};

exports.Prisma.Log_drum_scanScalarFieldEnum = {
  scan_id: 'scan_id',
  scanned_at: 'scanned_at',
  drum_id: 'drum_id',
  user_id: 'user_id',
  scan_type: 'scan_type',
  scan_status: 'scan_status',
  error_message: 'error_message'
};

exports.Prisma.Log_load_stillScalarFieldEnum = {
  loading_id: 'loading_id',
  scan_id: 'scan_id',
  drum_id: 'drum_id',
  still_id: 'still_id',
  distillation_id: 'distillation_id',
  status: 'status'
};

exports.Prisma.Log_start_distillationScalarFieldEnum = {
  start_id: 'start_id',
  distillation_id: 'distillation_id',
  still_id: 'still_id',
  worker_id: 'worker_id',
  status: 'status'
};

exports.Prisma.Log_transport_drumScalarFieldEnum = {
  transport_id: 'transport_id',
  scan_id: 'scan_id',
  drum_id: 'drum_id',
  transported_at: 'transported_at',
  distillation_id: 'distillation_id',
  status: 'status'
};

exports.Prisma.Log_volume_transferScalarFieldEnum = {
  transfer_id: 'transfer_id',
  drum_id: 'drum_id',
  distillation_id: 'distillation_id',
  volume_transferred: 'volume_transferred',
  remaining_volume: 'remaining_volume',
  usage_type: 'usage_type',
  transfer_timestamp: 'transfer_timestamp',
  worker_id: 'worker_id'
};

exports.Prisma.NotificationScalarFieldEnum = {
  notification_id: 'notification_id',
  message: 'message',
  message_type: 'message_type',
  private: 'private',
  audience_type: 'audience_type',
  is_read: 'is_read',
  created_at: 'created_at',
  expires_at: 'expires_at',
  created_by: 'created_by'
};

exports.Prisma.Order_detailScalarFieldEnum = {
  detail_id: 'detail_id',
  order_id: 'order_id',
  batch_code: 'batch_code',
  material_id: 'material_id',
  material_name: 'material_name',
  drum_quantity: 'drum_quantity',
  drum_weight: 'drum_weight',
  drum_volume: 'drum_volume',
  status: 'status',
  notes: 'notes',
  material_code: 'material_code'
};

exports.Prisma.Product_pricesScalarFieldEnum = {
  product_id: 'product_id',
  bottle_size_id: 'bottle_size_id',
  price: 'price'
};

exports.Prisma.Raw_materialsScalarFieldEnum = {
  material_id: 'material_id',
  material_name: 'material_name',
  cas_number: 'cas_number',
  chemical_group: 'chemical_group',
  description: 'description',
  un_code: 'un_code',
  flash_point: 'flash_point',
  material_code: 'material_code',
  drum_weight: 'drum_weight',
  drum_volume: 'drum_volume',
  chemical_props: 'chemical_props'
};

exports.Prisma.Ref_materialsScalarFieldEnum = {
  value: 'value',
  code: 'code',
  chemical_group: 'chemical_group',
  cas_number: 'cas_number'
};

exports.Prisma.Ref_stillsScalarFieldEnum = {
  still_id: 'still_id',
  still_code: 'still_code',
  max_capacity: 'max_capacity',
  power_rating_kw: 'power_rating_kw',
  lab_id: 'lab_id',
  is_vacuum: 'is_vacuum',
  is_operational: 'is_operational',
  description: 'description'
};

exports.Prisma.Ref_suppliersScalarFieldEnum = {
  supplier_id: 'supplier_id',
  supplier_name: 'supplier_name',
  addr_1: 'addr_1',
  addr_2: 'addr_2',
  city: 'city',
  post_code: 'post_code',
  country_code: 'country_code'
};

exports.Prisma.Session_settingsScalarFieldEnum = {
  id: 'id',
  device_type: 'device_type',
  session_duration_seconds: 'session_duration_seconds',
  inactivity_timeout_seconds: 'inactivity_timeout_seconds',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Stock_drumScalarFieldEnum = {
  drum_id: 'drum_id',
  drum_type: 'drum_type',
  order_detail_id: 'order_detail_id',
  fill_level: 'fill_level',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at',
  material_code: 'material_code',
  distillation_id: 'distillation_id'
};

exports.Prisma.Stock_drum_newScalarFieldEnum = {
  drum_id: 'drum_id',
  material_code: 'material_code',
  drum_type: 'drum_type',
  order_detail_id: 'order_detail_id',
  status: 'status',
  fill_level: 'fill_level',
  created_at: 'created_at',
  updated_at: 'updated_at',
  distillation_id: 'distillation_id'
};

exports.Prisma.Stock_newScalarFieldEnum = {
  stock_id: 'stock_id',
  supplier_id: 'supplier_id',
  quantity: 'quantity',
  batch_code: 'batch_code',
  location: 'location',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at',
  material_code: 'material_code'
};

exports.Prisma.Stock_orderScalarFieldEnum = {
  order_id: 'order_id',
  po_number: 'po_number',
  date_ordered: 'date_ordered',
  supplier_id: 'supplier_id',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Stock_reproScalarFieldEnum = {
  stock_id: 'stock_id',
  location: 'location',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at',
  quantity: 'quantity',
  material_description: 'material_description',
  material_code: 'material_code'
};

exports.Prisma.User_profilesScalarFieldEnum = {
  id: 'id',
  full_name: 'full_name',
  email: 'email',
  avatar_url: 'avatar_url'
};

exports.Prisma.User_rolesScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  role: 'role',
  created_at: 'created_at'
};

exports.Prisma.Worker_passcodesScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  worker_name: 'worker_name',
  role: 'role',
  passcode: 'passcode',
  is_active: 'is_active',
  last_login_at: 'last_login_at',
  created_at: 'created_at',
  updated_at: 'updated_at',
  created_by: 'created_by',
  updated_by: 'updated_by'
};

exports.Prisma.Order_detail_stock_activityScalarFieldEnum = {
  id: 'id',
  order_detail_id: 'order_detail_id',
  stock_activity_id: 'stock_activity_id',
  created_at: 'created_at'
};

exports.Prisma.Raw_stock_historyScalarFieldEnum = {
  id: 'id',
  date: 'date',
  event_str: 'event_str',
  drum_type: 'drum_type',
  no_events: 'no_events',
  notes_ids: 'notes_ids',
  notes_batch: 'notes_batch',
  source: 'source',
  created_at: 'created_at',
  updated_at: 'updated_at',
  material_code: 'material_code'
};

exports.Prisma.Stock_activityScalarFieldEnum = {
  id: 'id',
  activity_date: 'activity_date',
  material_code: 'material_code',
  supplier_id: 'supplier_id',
  quantity: 'quantity',
  drum_type: 'drum_type',
  drum_ids: 'drum_ids',
  batch_code: 'batch_code',
  order_detail_id: 'order_detail_id',
  distillation_detail_id: 'distillation_detail_id',
  activity_type: 'activity_type',
  status: 'status',
  notes: 'notes',
  source_record_id: 'source_record_id',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Stock_historyScalarFieldEnum = {
  id: 'id',
  date: 'date',
  material_name: 'material_name',
  supplier_id: 'supplier_id',
  supplier_name: 'supplier_name',
  change: 'change',
  drum_type: 'drum_type',
  drum_ids: 'drum_ids',
  batch_code: 'batch_code',
  source_record_id: 'source_record_id',
  created_at: 'created_at',
  updated_at: 'updated_at',
  material_code: 'material_code'
};

exports.Prisma.Ref_productScalarFieldEnum = {
  product_id: 'product_id',
  name: 'name',
  sku: 'sku',
  raw_material_id: 'raw_material_id',
  grade: 'grade',
  material_code: 'material_code'
};

exports.Prisma.Ref_supplier_materialScalarFieldEnum = {
  supplier_id: 'supplier_id',
  material_name: 'material_name',
  quantity: 'quantity',
  location: 'location',
  updated_at: 'updated_at',
  material_code: 'material_code'
};

exports.Prisma.User_queriesScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  query_name: 'query_name',
  created_at: 'created_at',
  last_executed_at: 'last_executed_at',
  execution_count: 'execution_count',
  selected_table: 'selected_table',
  selected_columns: 'selected_columns',
  filters: 'filters',
  sorts: 'sorts',
  join_table: 'join_table',
  join_type: 'join_type',
  join_condition: 'join_condition',
  generated_sql: 'generated_sql',
  tags: 'tags'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};


exports.Prisma.ModelName = {
  active_context: 'active_context',
  auth_activity_log: 'auth_activity_log',
  bottle_sizes: 'bottle_sizes',
  chemical_group_kind: 'chemical_group_kind',
  distillation_pending_assignment: 'distillation_pending_assignment',
  distillation_record: 'distillation_record',
  distillation_schedule: 'distillation_schedule',
  distillation_schedule_items: 'distillation_schedule_items',
  drums: 'drums',
  log_drum_decommission: 'log_drum_decommission',
  log_drum_scan: 'log_drum_scan',
  log_load_still: 'log_load_still',
  log_start_distillation: 'log_start_distillation',
  log_transport_drum: 'log_transport_drum',
  log_volume_transfer: 'log_volume_transfer',
  notification: 'notification',
  order_detail: 'order_detail',
  product_prices: 'product_prices',
  raw_materials: 'raw_materials',
  ref_materials: 'ref_materials',
  ref_stills: 'ref_stills',
  ref_suppliers: 'ref_suppliers',
  session_settings: 'session_settings',
  stock_drum: 'stock_drum',
  stock_drum_new: 'stock_drum_new',
  stock_new: 'stock_new',
  stock_order: 'stock_order',
  stock_repro: 'stock_repro',
  user_profiles: 'user_profiles',
  user_roles: 'user_roles',
  worker_passcodes: 'worker_passcodes',
  order_detail_stock_activity: 'order_detail_stock_activity',
  raw_stock_history: 'raw_stock_history',
  stock_activity: 'stock_activity',
  stock_history: 'stock_history',
  ref_product: 'ref_product',
  ref_supplier_material: 'ref_supplier_material',
  user_queries: 'user_queries'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
