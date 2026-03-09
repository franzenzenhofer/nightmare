// === Services ===
import { SecurityZones } from '../services/security-zones';
import { JsonStorage } from '../services/storage';
import { BookmarkManager } from '../services/bookmarks';
import { HistoryManager } from '../services/history';
import { SettingsManager } from '../services/settings';
import { TabManager } from '../services/tab-manager';
import { createTab } from '../services/tab';
import { resolveUrl, toDisplayUrl } from '../services/navigation';
import { getMimeType, decodeFilePath } from '../services/file-server';
import {
  KeyboardShortcuts,
  parseKeyCombo,
  normalizeKeyName,
} from '../services/keyboard-shortcuts';
import { DownloadsManager } from '../services/downloads';
import { NavigationTracker } from '../services/navigation-tracker';
import { getNodeBridgeConfig } from '../services/node-bridge';
import { NotificationManager } from '../services/notification';
import { LoadingStateManager } from '../services/loading-states';
import { CookieManager } from '../services/cookie-manager';
import { ClosedTabsManager } from '../services/closed-tabs';
import { SessionManager } from '../services/session';
import { ZoomManager, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, ZOOM_DEFAULT } from '../services/zoom-manager';
import { UserAgentManager } from '../services/user-agent';
import { buildQueryRequest, validateSelector as validateDomSelector, DomQueryService, createElementInfo, filterByVisibility, filterByTagName, filterByAttribute } from '../services/dom-query';
import { isViewSourceUrl, parseViewSourceUrl, formatSourceHtml } from '../services/page-source';
import { validateDirectiveValue, generateCspDirectives, buildCspHeader, applyOverrides as applyCspOverrides, CSP_DIRECTIVE_NAMES } from '../services/csp';
import { suggest as urlAutocompleteSuggest } from '../services/url-autocomplete';
import { FileDropService } from '../services/file-drop';
import { ConsoleStream } from '../services/console-stream';
import { NetworkLog } from '../services/network-log';
import { CertificateStore } from '../services/certificate-info';
import { RelaunchManager } from '../services/relaunch';
import { TabDragManager } from '../services/tab-drag';
import { TabMuteManager } from '../services/tab-mute';
import { TabSuspendManager } from '../services/tab-suspend';
import { LazyTabService } from '../services/lazy-tabs';
import { WaitForManager, DEFAULT_TIMEOUT as WAIT_DEFAULT_TIMEOUT, DEFAULT_POLL_INTERVAL } from '../services/wait-for';
import { MultiScreenshotService } from '../services/multi-screenshot';
import { PrintManager } from '../services/print-to-pdf';
import { ResponsiveMode, DEVICE_PRESETS, VIEWPORT_MIN_WIDTH, VIEWPORT_MIN_HEIGHT, VIEWPORT_MAX_WIDTH, VIEWPORT_MAX_HEIGHT, DEFAULT_DEVICE_PIXEL_RATIO } from '../services/responsive-mode';
import { InteractionService, buildClickRequest, buildTypeRequest, buildSelectRequest, buildFocusRequest, buildScrollRequest, validateSelector as validateInteractionSelector } from '../services/click-interact';
import { getErrorPageHtml, ERROR_TYPES } from '../services/error-pages';
import { getDemosByZone, validateDemoConfig, DEMO_APPS } from '../services/demo-apps';
import { createBuildConfig, validateBuildConfig, getBuildCommand } from '../services/build-config';
import { shouldAutoOpen as shouldAutoOpenDevTools } from '../services/devtools-config';
import { parseCliArgs, getStartupJson } from '../services/headless-config';
import { createIconConfigs, getIconPath, ICON_SIZES, NIGHTMARE_ICON_SVG } from '../services/icon-config';
import { getApiCoverage, getMissingApiActions, getCoveragePercentage, UI_ACTIONS } from '../services/api-verification';
import { exportToJson as exportBookmarksToJson, importFromJson as importBookmarksFromJson, exportToNetscapeHtml, importFromNetscapeHtml } from '../services/bookmark-io';
import { escapeHtml as escapeBookmarkHtml, decodeHtmlEntities, renderFolder as renderBookmarkFolder, parseHtmlLines } from '../services/bookmark-io-html';
import { classifyTag, convertPathToOpenApi, buildPathParams, buildRequestBody, buildOperation, collectTags, generateOpenApiSpec } from '../services/openapi-spec';
import { ROUTE_METADATA } from '../services/openapi-routes';
import { escapeHtml as markdownEscapeHtml, inlineFormat as markdownInlineFormat, renderMarkdown } from '../services/markdown';

// === Components ===
import { SecurityBannerLogic } from '../components/security-banner';
import { getNavBarState } from '../components/nav-bar';
import { getStatusBarState } from '../components/status-bar';
import { getWindowTitle } from '../components/titlebar';
import { getBarItems, isBookmarked } from '../components/bookmarks-bar';
import { getDisplayOrder, reorder, getCloseTarget } from '../components/tab-bar';
import { FindBarLogic } from '../components/find-bar';
import { SidebarLogic } from '../components/sidebar';
import { ContextMenuLogic } from '../components/context-menu';
import { getSuggestions } from '../components/url-input';
import { SystemTrayLogic } from '../components/system-tray';

// === API ===
import { EventBus } from '../api/event-bus';
import { ConsoleCapture } from '../api/console-capture';
import { Router } from '../api/router';
import { RouteRegistry, extractPathParamNames } from '../api/route-registry';
import { createApiRouter, createRouteRegistry, param } from '../api/handlers';
import { WsBroadcaster } from '../api/ws-broadcaster';
import { McpToolRegistry } from '../api/mcp/tools';
import { ApiServer } from '../api/server';
import { registerAllRoutes } from '../api/route-definitions';

// === Orchestrator ===
import { BrowserOrchestrator } from '../browser-orchestrator';

// === Browser Init ===
import { initBrowser } from './browser-init';

declare global {
  interface Window {
    Nightmare?: {
      // Browser Init
      initBrowser: typeof initBrowser;

      // Services
      SecurityZones: typeof SecurityZones;
      JsonStorage: typeof JsonStorage;
      BookmarkManager: typeof BookmarkManager;
      HistoryManager: typeof HistoryManager;
      SettingsManager: typeof SettingsManager;
      TabManager: typeof TabManager;
      createTab: typeof createTab;
      resolveUrl: typeof resolveUrl;
      toDisplayUrl: typeof toDisplayUrl;
      getMimeType: typeof getMimeType;
      decodeFilePath: typeof decodeFilePath;
      KeyboardShortcuts: typeof KeyboardShortcuts;
      parseKeyCombo: typeof parseKeyCombo;
      normalizeKeyName: typeof normalizeKeyName;
      DownloadsManager: typeof DownloadsManager;
      NavigationTracker: typeof NavigationTracker;
      getNodeBridgeConfig: typeof getNodeBridgeConfig;
      NotificationManager: typeof NotificationManager;
      LoadingStateManager: typeof LoadingStateManager;
      CookieManager: typeof CookieManager;
      ClosedTabsManager: typeof ClosedTabsManager;
      SessionManager: typeof SessionManager;
      ZoomManager: typeof ZoomManager;
      ZOOM_MIN: typeof ZOOM_MIN;
      ZOOM_MAX: typeof ZOOM_MAX;
      ZOOM_STEP: typeof ZOOM_STEP;
      ZOOM_DEFAULT: typeof ZOOM_DEFAULT;
      UserAgentManager: typeof UserAgentManager;
      buildQueryRequest: typeof buildQueryRequest;
      validateDomSelector: typeof validateDomSelector;
      DomQueryService: typeof DomQueryService;
      createElementInfo: typeof createElementInfo;
      filterByVisibility: typeof filterByVisibility;
      filterByTagName: typeof filterByTagName;
      filterByAttribute: typeof filterByAttribute;
      isViewSourceUrl: typeof isViewSourceUrl;
      parseViewSourceUrl: typeof parseViewSourceUrl;
      formatSourceHtml: typeof formatSourceHtml;
      validateDirectiveValue: typeof validateDirectiveValue;
      generateCspDirectives: typeof generateCspDirectives;
      buildCspHeader: typeof buildCspHeader;
      applyCspOverrides: typeof applyCspOverrides;
      CSP_DIRECTIVE_NAMES: typeof CSP_DIRECTIVE_NAMES;
      urlAutocompleteSuggest: typeof urlAutocompleteSuggest;
      FileDropService: typeof FileDropService;
      ConsoleStream: typeof ConsoleStream;
      NetworkLog: typeof NetworkLog;
      CertificateStore: typeof CertificateStore;
      RelaunchManager: typeof RelaunchManager;
      TabDragManager: typeof TabDragManager;
      TabMuteManager: typeof TabMuteManager;
      TabSuspendManager: typeof TabSuspendManager;
      LazyTabService: typeof LazyTabService;
      WaitForManager: typeof WaitForManager;
      WAIT_DEFAULT_TIMEOUT: typeof WAIT_DEFAULT_TIMEOUT;
      DEFAULT_POLL_INTERVAL: typeof DEFAULT_POLL_INTERVAL;
      MultiScreenshotService: typeof MultiScreenshotService;
      PrintManager: typeof PrintManager;
      ResponsiveMode: typeof ResponsiveMode;
      DEVICE_PRESETS: typeof DEVICE_PRESETS;
      VIEWPORT_MIN_WIDTH: typeof VIEWPORT_MIN_WIDTH;
      VIEWPORT_MIN_HEIGHT: typeof VIEWPORT_MIN_HEIGHT;
      VIEWPORT_MAX_WIDTH: typeof VIEWPORT_MAX_WIDTH;
      VIEWPORT_MAX_HEIGHT: typeof VIEWPORT_MAX_HEIGHT;
      DEFAULT_DEVICE_PIXEL_RATIO: typeof DEFAULT_DEVICE_PIXEL_RATIO;
      InteractionService: typeof InteractionService;
      buildClickRequest: typeof buildClickRequest;
      buildTypeRequest: typeof buildTypeRequest;
      buildSelectRequest: typeof buildSelectRequest;
      buildFocusRequest: typeof buildFocusRequest;
      buildScrollRequest: typeof buildScrollRequest;
      validateInteractionSelector: typeof validateInteractionSelector;
      getErrorPageHtml: typeof getErrorPageHtml;
      ERROR_TYPES: typeof ERROR_TYPES;
      getDemosByZone: typeof getDemosByZone;
      validateDemoConfig: typeof validateDemoConfig;
      DEMO_APPS: typeof DEMO_APPS;
      createBuildConfig: typeof createBuildConfig;
      validateBuildConfig: typeof validateBuildConfig;
      getBuildCommand: typeof getBuildCommand;
      shouldAutoOpenDevTools: typeof shouldAutoOpenDevTools;
      parseCliArgs: typeof parseCliArgs;
      getStartupJson: typeof getStartupJson;
      createIconConfigs: typeof createIconConfigs;
      getIconPath: typeof getIconPath;
      ICON_SIZES: typeof ICON_SIZES;
      NIGHTMARE_ICON_SVG: typeof NIGHTMARE_ICON_SVG;
      getApiCoverage: typeof getApiCoverage;
      getMissingApiActions: typeof getMissingApiActions;
      getCoveragePercentage: typeof getCoveragePercentage;
      UI_ACTIONS: typeof UI_ACTIONS;
      exportBookmarksToJson: typeof exportBookmarksToJson;
      importBookmarksFromJson: typeof importBookmarksFromJson;
      exportToNetscapeHtml: typeof exportToNetscapeHtml;
      importFromNetscapeHtml: typeof importFromNetscapeHtml;
      escapeBookmarkHtml: typeof escapeBookmarkHtml;
      decodeHtmlEntities: typeof decodeHtmlEntities;
      renderBookmarkFolder: typeof renderBookmarkFolder;
      parseHtmlLines: typeof parseHtmlLines;
      classifyTag: typeof classifyTag;
      convertPathToOpenApi: typeof convertPathToOpenApi;
      buildPathParams: typeof buildPathParams;
      buildRequestBody: typeof buildRequestBody;
      buildOperation: typeof buildOperation;
      collectTags: typeof collectTags;
      generateOpenApiSpec: typeof generateOpenApiSpec;
      ROUTE_METADATA: typeof ROUTE_METADATA;
      markdownEscapeHtml: typeof markdownEscapeHtml;
      markdownInlineFormat: typeof markdownInlineFormat;
      renderMarkdown: typeof renderMarkdown;

      // Components
      SecurityBannerLogic: typeof SecurityBannerLogic;
      getNavBarState: typeof getNavBarState;
      getStatusBarState: typeof getStatusBarState;
      getWindowTitle: typeof getWindowTitle;
      getBarItems: typeof getBarItems;
      isBookmarked: typeof isBookmarked;
      getDisplayOrder: typeof getDisplayOrder;
      reorder: typeof reorder;
      getCloseTarget: typeof getCloseTarget;
      FindBarLogic: typeof FindBarLogic;
      SidebarLogic: typeof SidebarLogic;
      ContextMenuLogic: typeof ContextMenuLogic;
      getSuggestions: typeof getSuggestions;
      SystemTrayLogic: typeof SystemTrayLogic;

      // API
      EventBus: typeof EventBus;
      ConsoleCapture: typeof ConsoleCapture;
      Router: typeof Router;
      RouteRegistry: typeof RouteRegistry;
      extractPathParamNames: typeof extractPathParamNames;
      createApiRouter: typeof createApiRouter;
      createRouteRegistry: typeof createRouteRegistry;
      param: typeof param;
      WsBroadcaster: typeof WsBroadcaster;
      McpToolRegistry: typeof McpToolRegistry;
      ApiServer: typeof ApiServer;
      registerAllRoutes: typeof registerAllRoutes;

      // Orchestrator
      BrowserOrchestrator: typeof BrowserOrchestrator;
    };
  }
}

window.Nightmare = {
  ...(window.Nightmare ?? {}),

  // Browser Init
  initBrowser,

  // Services
  SecurityZones,
  JsonStorage,
  BookmarkManager,
  HistoryManager,
  SettingsManager,
  TabManager,
  createTab,
  resolveUrl,
  toDisplayUrl,
  getMimeType,
  decodeFilePath,
  KeyboardShortcuts,
  parseKeyCombo,
  normalizeKeyName,
  DownloadsManager,
  NavigationTracker,
  getNodeBridgeConfig,
  NotificationManager,
  LoadingStateManager,
  CookieManager,
  ClosedTabsManager,
  SessionManager,
  ZoomManager,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_STEP,
  ZOOM_DEFAULT,
  UserAgentManager,
  buildQueryRequest,
  validateDomSelector,
  DomQueryService,
  createElementInfo,
  filterByVisibility,
  filterByTagName,
  filterByAttribute,
  isViewSourceUrl,
  parseViewSourceUrl,
  formatSourceHtml,
  validateDirectiveValue,
  generateCspDirectives,
  buildCspHeader,
  applyCspOverrides,
  CSP_DIRECTIVE_NAMES,
  urlAutocompleteSuggest,
  FileDropService,
  ConsoleStream,
  NetworkLog,
  CertificateStore,
  RelaunchManager,
  TabDragManager,
  TabMuteManager,
  TabSuspendManager,
  LazyTabService,
  WaitForManager,
  WAIT_DEFAULT_TIMEOUT,
  DEFAULT_POLL_INTERVAL,
  MultiScreenshotService,
  PrintManager,
  ResponsiveMode,
  DEVICE_PRESETS,
  VIEWPORT_MIN_WIDTH,
  VIEWPORT_MIN_HEIGHT,
  VIEWPORT_MAX_WIDTH,
  VIEWPORT_MAX_HEIGHT,
  DEFAULT_DEVICE_PIXEL_RATIO,
  InteractionService,
  buildClickRequest,
  buildTypeRequest,
  buildSelectRequest,
  buildFocusRequest,
  buildScrollRequest,
  validateInteractionSelector,
  getErrorPageHtml,
  ERROR_TYPES,
  getDemosByZone,
  validateDemoConfig,
  DEMO_APPS,
  createBuildConfig,
  validateBuildConfig,
  getBuildCommand,
  shouldAutoOpenDevTools,
  parseCliArgs,
  getStartupJson,
  createIconConfigs,
  getIconPath,
  ICON_SIZES,
  NIGHTMARE_ICON_SVG,
  getApiCoverage,
  getMissingApiActions,
  getCoveragePercentage,
  UI_ACTIONS,
  exportBookmarksToJson,
  importBookmarksFromJson,
  exportToNetscapeHtml,
  importFromNetscapeHtml,
  escapeBookmarkHtml,
  decodeHtmlEntities,
  renderBookmarkFolder,
  parseHtmlLines,
  classifyTag,
  convertPathToOpenApi,
  buildPathParams,
  buildRequestBody,
  buildOperation,
  collectTags,
  generateOpenApiSpec,
  ROUTE_METADATA,
  markdownEscapeHtml,
  markdownInlineFormat,
  renderMarkdown,

  // Components
  SecurityBannerLogic,
  getNavBarState,
  getStatusBarState,
  getWindowTitle,
  getBarItems,
  isBookmarked,
  getDisplayOrder,
  reorder,
  getCloseTarget,
  FindBarLogic,
  SidebarLogic,
  ContextMenuLogic,
  getSuggestions,
  SystemTrayLogic,

  // API
  EventBus,
  ConsoleCapture,
  Router,
  RouteRegistry,
  extractPathParamNames,
  createApiRouter,
  createRouteRegistry,
  param,
  WsBroadcaster,
  McpToolRegistry,
  ApiServer,
  registerAllRoutes,

  // Orchestrator
  BrowserOrchestrator,
};
