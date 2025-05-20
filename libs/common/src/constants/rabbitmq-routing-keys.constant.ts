export enum RabbitRoutingKeys {
  MESSAGE_WORKER_EVENTS_UNSUSPEND_USER = 'message-worker.events.unSuspendUser',
  MESSAGE_WORKER_EVENTS_UNSUSPEND_POST = 'message-worker.events.unSuspendPost',
  MESSAGE_WORKER_EVENTS_UNSUSPEND_COMMENT = 'message-worker.events.unSuspendComment',

  USER_EVENTS = 'service.users.events',
  USER_RPC = 'service.users.rpc',

  ADMIN_EVENTS = 'service.admins.events',
  ADMIN_RPC = 'service.admins.rpc',

  ENGAGEMENT_EVENTS = 'service.engagement.events',
  ENGAGEMENT_RPC = 'service.engagement.rpc',

  POST_EVENTS = 'service.posts.events',
  POST_RPC = 'service.posts.rpc',

  PET_EVENTS = 'service.pets.events',
  PET_RPC = 'service.pets.rpc',

  NOTIFICATION_EVENTS = 'service.notifications.events',
  NOTIFICATION_EVENTS_ADMIN_SEND_NOTIFICATION = 'service.notifications.events.admin.sendNotification',
  NOTIFICATION_EVENTS_USER_SEND_MARKETING_USER_PUSH_NOTIFICATION = 'service.notifications.events.user.sendMarketingUserPushNotification',
  NOTIFICATION_EVENTS_USER_SEND_TOPIC_NOTIFICATION = 'service.notifications.events.user.sendTopicNotification',
  NOTIFICATION_RPC = 'service.notifications.rpc',
  NOTIFICATION_RPC_ADMIN_SUBSCRIBE_TO_TOPIC = 'service.notifications.rpc.admin.subscribeToTopic',
  NOTIFICATION_RPC_ADMIN_UNSUBSCRIBE_FROM_TOPIC = 'service.notifications.rpc.admin.unsubscribeFromTopic',
  NOTIFICATION_RPC_USER_SUBSCRIBE_TO_TOPIC = 'service.notifications.rpc.user.subscribeToTopic',
  NOTIFICATION_RPC_USER_UNSUBSCRIBE_FROM_TOPIC = 'service.notifications.rpc.user.unsubscribeFromTopic',

  NOTIFICATION_EVENTS_SERVICE_PROVIDER_SEND_NOTIFICATION = 'service.notifications.events.serviceProvider.sendNotification',

  CRON_EVENTS = 'service.cron.events',
  CRON_RPC = 'service.cron.rpc',

  SEARCH_EVENTS = 'service.search.events',
  SEARCH_RPC_ADMIN_GET_COUNTRIES_SEARCH_DATA = 'service.search.rpc.admin.getCountriesSearchData',
  SEARCH_RPC_ADMIN_GET_CITIES_SEARCH_DATA = 'service.search.rpc.admin.getCitiesSearchData',
  SEARCH_RPC_ADMIN_GET_AREAS_SEARCH_DATA = 'service.search.rpc.admin.getAreasSearchData',
  SEARCH_RPC_ADMIN_GET_PET_BREEDS_SEARCH_DATA = 'service.search.rpc.admin.getPetBreedsSearchData',
  SEARCH_RPC_ADMIN_GET_PET_TYPES_SEARCH_DATA = 'service.search.rpc.admin.getPetTypesSearchData',
  SEARCH_RPC_ADMIN_GET_PETS_SEARCH_DATA = 'service.search.rpc.admin.getPetsSearchData',
  SEARCH_RPC_ADMIN_GET_PETS_SEARCH_FILTER_DATA = 'service.search.rpc.admin.getPetsSearchFilterData',
  SEARCH_RPC_ADMIN_GET_USERS_SEARCH_DATA = 'service.search.rpc.admin.getUsersSearchData',
  SEARCH_RPC_ADMIN_GET_USERS_SEARCH_FILTER_DATA = 'service.search.rpc.admin.getUsersSearchFilterData',
  SEARCH_RPC_ADMIN_GET_POSTS_SEARCH_DATA = 'service.search.rpc.admin.getPostsSearchData',
  SEARCH_RPC_ADMIN_GET_POSTS_SEARCH_FILTER_DATA = 'service.search.rpc.admin.getPostsSearchFilterData',
  SEARCH_RPC_ADMIN_GET_COMMENTS_SEARCH_DATA = 'service.search.rpc.admin.getCommentsSearchData',
  SEARCH_RPC_ADMIN_GET_COMMENT_REPLIES_SEARCH_DATA = 'service.search.rpc.admin.getCommentRepliesSearchData',
  SEARCH_RPC_ADMIN_GET_BRANCH_SERVICE_TYPES_SEARCH_DATA = 'service.search.rpc.admin.getBranchServiceTypesSearchData',
  SEARCH_RPC_ADMIN_GET_SERVICE_PROVIDERS_SEARCH_DATA = 'service.search.rpc.admin.getServiceProvidersSearchData',
  SEARCH_RPC_ADMIN_GET_BRANCHES_SEARCH_DATA = 'service.search.rpc.admin.getBranchesSearchData',
  SEARCH_RPC_ADMIN_GET_ADMINS_SEARCH_DATA = 'service.search.rpc.admin.getAdminsSearchData',
  SEARCH_RPC_ADMIN_GET_EVENT_CATEGORIES_SEARCH_DATA = 'service.search.rpc.admin.getEventCategoriesSearchData',
  SEARCH_RPC_ADMIN_GET_EVENT_FACILITIES_SEARCH_DATA = 'service.search.rpc.admin.getEventFacilitiesSearchData',
  SEARCH_RPC_ADMIN_GET_CLINIC_APPOINTMENTS_SEARCH_DATA = 'service.search.rpc.admin.getClinicAppointmentsSearchData',
  SEARCH_RPC_ADMIN_GET_USER_SEGMENTS_SEARCH_DATA = 'service.search.rpc.admin.getUserSegmentsSearchData',
  SEARCH_RPC_ADMIN_GET_USER_SEGMENTS_SEARCH_FILTER_DATA = 'service.search.rpc.admin.getUserSegmentsSearchFilterData',
  SEARCH_RPC_ADMIN_GET_DYNAMIC_LINKS_SEARCH_DATA = 'service.search.rpc.admin.getDynamicLinksSearchData',
  SEARCH_RPC_ADMIN_GET_DYNAMIC_LINKS_SEARCH_FILTER_DATA = 'service.search.rpc.admin.getDynamicLinksSearchFilterData',
  SEARCH_RPC_ADMIN_GET_USER_PUSH_NOTIFICATIONS_SEARCH_DATA = 'service.search.rpc.admin.getUserPushNotificationsSearchData',
  SEARCH_RPC_ADMIN_GET_LOST_POSTS_SEARCH_DATA = 'service.search.rpc.admin.getLostPostsSearchData',
  SEARCH_RPC_ADMIN_GET_LOST_POSTS_SEARCH_FILTER_DATA = 'service.search.rpc.admin.getLostPostsSearchFilterData',
  SEARCH_RPC_ADMIN_GET_FOUND_POSTS_SEARCH_DATA = 'service.search.rpc.admin.getFoundPostsSearchData',
  SEARCH_RPC_ADMIN_GET_FOUND_POSTS_SEARCH_FILTER_DATA = 'service.search.rpc.admin.getFoundPostsSearchFilterData',

  SEARCH_RPC_USER_GET_PETS_SEARCH_DATA = 'service.search.rpc.user.getPetsSearchData',
  SEARCH_RPC_USER_GET_PET_FOLLOWERS_SEARCH_DATA = 'service.search.rpc.user.getPetFollowersSearchData',
  SEARCH_RPC_USER_GET_FOLLOWED_PETS_SEARCH_DATA = 'service.search.rpc.user.getFollowedPetsSearchData',
  SEARCH_RPC_USER_GET_USERS_SEARCH_DATA = 'service.search.rpc.user.getUsersSearchData',
  SEARCH_RPC_USER_GET_USER_FOLLOWERS_SEARCH_DATA = 'service.search.rpc.user.getUserFollowersSearchData',
  SEARCH_RPC_USER_GET_USER_FOLLOWINGS_SEARCH_DATA = 'service.search.rpc.user.getUserFollowingsSearchData',
  SEARCH_RPC_USER_GET_USER_FOLLOWED_PETS_SEARCH_DATA = 'service.search.rpc.user.getUserFollowedPetsSearchData',

  MODERATION_EVENTS = 'service.moderation.events',
  MODERATION_RPC = 'service.moderation.rpc',

  FEED_EVENTS = 'service.feed.events',
  FEED_RPC = 'service.feed.rpc',

  DISCOVERY_EVENTS = 'service.discovery.events',
  DISCOVERY_RPC = 'service.discovery.rpc',

  AUTHENTICATION_EVENTS = 'service.authentication.events',
  AUTHENTICATION_RPC = 'service.authentication.rpc',

  AREA_EVENTS = 'service.areas.events',
  AREA_RPC = 'service.areas.rpc',

  GRAPH_SYNC_RPC_MIGRATE_MODEL = 'service.graphsync.rpc.migrateModel',

  ELASTICSEARCH_SYNC_EVENTS_PROPAGATE_FIELD_UPDATE = 'service.elasticsearchsync.events.propagateFieldUpdate',
  ELASTICSEARCH_SYNC_RPC = 'service.elasticsearchsync.rpc',

  SOCKET_DISCONNECTION_EVENTS = 'socket.disconnection.events',
}
