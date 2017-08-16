'use strict';

var modules = [
  'ui.router',
  'angularMoment',
  'monospaced.qrcode',
  'gettext',
  'ionic',
  'ionic.cloud',
  'ngLodash',
  'ngSanitize',
  'ngCsv',
  'bwcModule',
  'copayApp.filters',
  'copayApp.services',
  'copayApp.controllers',
  'copayApp.directives',
  'copayApp.addons'
];

var copayApp = window.copayApp = angular.module('copayApp', modules);

angular.module('copayApp.filters', []);
angular.module('copayApp.services', []);
angular.module('copayApp.controllers', []);
angular.module('copayApp.directives', []);
angular.module('copayApp.addons', ['copayAddon.colu']);

'use strict';

var unsupported, isaosp;

if (window && window.navigator) {
  var rxaosp = window.navigator.userAgent.match(/Android.*AppleWebKit\/([\d.]+)/);
  isaosp = (rxaosp && rxaosp[1] < 537);
  if (!window.cordova && isaosp)
    unsupported = true;
  if (unsupported) {
    window.location = '#/unsupported';
  }
}

//Setting up route
angular.module('copayApp').config(function(historicLogProvider, $provide, $logProvider, $stateProvider, $urlRouterProvider, $compileProvider, coluConfigProvider, instanceConfigProvider, $ionicCloudProvider) {
    $urlRouterProvider.otherwise('/');

    // default mode is SDK
    var coluConfig = {
        apiKey: instanceConfigProvider.config.coluApiKey,
        mode: 'sdk'
    };

    if (instanceConfigProvider.config.colu && instanceConfigProvider.config.colu.mode === 'rpc') {
      coluConfig = {
        rpcConfig: instanceConfigProvider.config.colu.rpcConfig,
        mode: 'rpc'
      };
    }

    $ionicCloudProvider.init({
      "core": {
        "app_id": "APP_ID"
      },
      "push": {
        "sender_id": "SENDER_ID",
        "pluginConfig": {
          "ios": {
            "badge": true,
            "sound": true
          },
          "android": {
            "iconColor": "#343434"
          }
        }
      }
    });

    coluConfigProvider.config(coluConfig);

    $logProvider.debugEnabled(true);
    $provide.decorator('$log', ['$delegate', 'platformInfo',
      function($delegate, platformInfo) {
        var historicLog = historicLogProvider.$get();

        ['debug', 'info', 'warn', 'error', 'log'].forEach(function(level) {
          if (platformInfo.isDevel && level == 'error') return;

          var orig = $delegate[level];
          $delegate[level] = function() {
            if (level == 'error')
              console.log(arguments);

            var args = Array.prototype.slice.call(arguments);

            args = args.map(function(v) {
              try {
                if (typeof v == 'undefined') v = 'undefined';
                if (!v) v = 'null';
                if (typeof v == 'object') {
                  if (v.message)
                    v = v.message;
                  else
                    v = JSON.stringify(v);
                }
                // Trim output in mobile
                if (platformInfo.isCordova) {
                  v = v.toString();
                  if (v.length > 3000) {
                    v = v.substr(0, 2997) + '...';
                  }
                }
              } catch (e) {
                console.log('Error at log decorator:', e);
                v = 'undefined';
              }
              return v;
            });

            try {
              if (platformInfo.isCordova)
                console.log(args.join(' '));

              historicLog.add(level, args.join(' '));
              orig.apply(null, args);
            } catch (e) {
              console.log('ERROR (at log decorator):', e, args[0]);
            }
          };
        });
        return $delegate;
      }
    ]);

    // whitelist 'chrome-extension:' for chromeApp to work with image URLs processed by Angular
    // link: http://stackoverflow.com/questions/15606751/angular-changes-urls-to-unsafe-in-extension-page?lq=1
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob|chrome-extension):|data:image\/)/);

    $stateProvider
      .state('translators', {
        url: '/translators',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/translators.html'
          }
        }
      })
      .state('disclaimer', {
        url: '/disclaimer',
        needProfile: false,
        views: {
          'main': {
            templateUrl: 'views/disclaimer.html',
          }
        }
      })
      .state('walletHome', {
        url: '/',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateProvider: function(instanceConfig, $state, $http, $templateCache) {
              var url = 'views/walletHome.html';
              if (!instanceConfig.assets) {
                $state.get('walletHome').needProfile = false;
                url = 'views/notFound.html';
              }

              return $http.get(url, { cache: $templateCache }).then(function(html){
                  return html.data;
              });
            },
          },
        }
      })
      .state('unsupported', {
        url: '/unsupported',
        needProfile: false,
        views: {
          'main': {
            templateUrl: 'views/unsupported.html'
          }
        }
      })
      .state('uri', {
        url: '/uri/:url',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/uri.html'
          }
        }
      })
      .state('uripayment', {
        url: '/uri-payment/:url',
        templateUrl: 'views/paymentUri.html',
        views: {
          'main': {
            templateUrl: 'views/paymentUri.html',
          },
        },
        needProfile: true
      })
      .state('join', {
        url: '/join',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/join.html'
          },
        }
      })
      .state('import', {
        url: '/import',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/import.html'
          },
        }
      })
      .state('create', {
        url: '/create',
        templateUrl: 'views/create.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/create.html'
          },
        }
      })
      .state('copayers', {
        url: '/copayers',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/copayers.html'
          },
        }
      })
      .state('preferences', {
        url: '/preferences',
        templateUrl: 'views/preferences.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferences.html',
          },
        }
      })
      .state('preferencesLanguage', {
        url: '/preferencesLanguage',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesLanguage.html'
          },
        }
      })
      .state('preferencesUnit', {
        url: '/preferencesUnit',
        templateUrl: 'views/preferencesUnit.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesUnit.html'
          },
        }
      })
      .state('preferencesFee', {
        url: '/preferencesFee',
        templateUrl: 'views/preferencesFee.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesFee.html'
          },
        }
      })
      .state('uriglidera', {
        url: '/uri-glidera/:url',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/glideraUri.html'
          },
        }
      })
      .state('glidera', {
        url: '/glidera',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/glidera.html'
          },
        }
      })
      .state('buyGlidera', {
        url: '/buy',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/buyGlidera.html'
          },
        }
      })
      .state('sellGlidera', {
        url: '/sell',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/sellGlidera.html'
          },
        }
      })
      .state('preferencesGlidera', {
        url: '/preferencesGlidera',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesGlidera.html'
          },
        }
      })
      .state('coinbase', {
        url: '/coinbase',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/coinbase.html'
          },
        }
      })
      .state('preferencesCoinbase', {
        url: '/preferencesCoinbase',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesCoinbase.html'
          },
        }
      })
      .state('uricoinbase', {
        url: '/uri-coinbase/:url',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/coinbaseUri.html'
          },
        }
      })
      .state('buyCoinbase', {
        url: '/buycoinbase',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/buyCoinbase.html'
          },
        }
      })
      .state('sellCoinbase', {
        url: '/sellcoinbase',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/sellCoinbase.html'
          },
        }
      })
      .state('buyandsell', {
        url: '/buyandsell',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/buyAndSell.html',
            controller: function(platformInfo) {
              if (platformInfo.isCordova && StatusBar.isVisible) {
                StatusBar.backgroundColorByHexString("#4B6178");
              }
            }
          }
        }
      })
      .state('amazon', {
        url: '/amazon',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/amazon.html'
          },
        }
      })
      .state('buyAmazon', {
        url: '/buyamazon',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/buyAmazon.html'
          },
        }
      })
      .state('preferencesAdvanced', {
        url: '/preferencesAdvanced',
        templateUrl: 'views/preferencesAdvanced.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesAdvanced.html'
          },
        }
      })
      .state('preferencesColor', {
        url: '/preferencesColor',
        templateUrl: 'views/preferencesColor.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesColor.html'
          },
        }
      })
      .state('preferencesAltCurrency', {
        url: '/preferencesAltCurrency',
        templateUrl: 'views/preferencesAltCurrency.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesAltCurrency.html'
          },
        }
      })
      .state('preferencesAlias', {
        url: '/preferencesAlias',
        templateUrl: 'views/preferencesAlias.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesAlias.html'
          },

        }
      })
      .state('preferencesEmail', {
        url: '/preferencesEmail',
        templateUrl: 'views/preferencesEmail.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesEmail.html'
          },

        }
      })
      .state('preferencesBwsUrl', {
        url: '/preferencesBwsUrl',
        templateUrl: 'views/preferencesBwsUrl.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesBwsUrl.html'
          },

        }
      })
      .state('preferencesHistory', {
        url: '/preferencesHistory',
        templateUrl: 'views/preferencesHistory.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesHistory.html'
          },

        }
      })
      .state('deleteWords', {
        url: '/deleteWords',
        templateUrl: 'views/preferencesDeleteWords.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesDeleteWords.html'
          },
        }
      })
      .state('delete', {
        url: '/delete',
        templateUrl: 'views/preferencesDeleteWallet.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesDeleteWallet.html'
          },
        }
      })
      .state('information', {
        url: '/information',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesInformation.html'
          },
        }
      })
      .state('about', {
        url: '/about',
        templateUrl: 'views/preferencesAbout.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesAbout.html'
          },
        }
      })
      .state('logs', {
        url: '/logs',
        templateUrl: 'views/preferencesLogs.html',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesLogs.html'
          },
        }
      })
      .state('export', {
        url: '/export',
        templateUrl: 'views/export.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/export.html'
          },
        }
      })
      .state('paperWallet', {
        url: '/paperWallet',
        templateUrl: 'views/paperWallet.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/paperWallet.html'
          },
        }
      })
      .state('backup', {
        url: '/backup',
        templateUrl: 'views/backup.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/backup.html'
          },
        }
      })
      .state('preferencesGlobal', {
        url: '/preferencesGlobal',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/preferencesGlobal.html',
          },
        }
      })
      .state('termOfUse', {
        url: '/termOfUse',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/termOfUse.html',
          },
        }
      })
      .state('add', {
        url: '/add',
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/add.html',
            controller: function(platformInfo) {
              if (platformInfo.isCordova && StatusBar.isVisible) {
                StatusBar.backgroundColorByHexString("#4B6178");
              }
            }
          }
        }
      })
      .state('walletInfo', {
        url: '/walletInfo',
        templateUrl: 'views/walletInfo.html',
        walletShouldBeComplete: true,
        needProfile: true,
        views: {
          'main': {
            templateUrl: 'views/walletInfo.html'
          }
        }
      });
  })
  .run(function($rootScope, $state, $location, $log, $timeout, $ionicPlatform, lodash, platformInfo, profileService, uxLanguage, go, gettextCatalog, instanceConfig) {

    if (platformInfo.isCordova) {
      if (screen.width < 768) {
        // $cordovaScreenOrientation.lockOrientation('portrait');
      } else {
        window.addEventListener("orientationchange", function() {
          var leftMenuWidth = document.querySelector("ion-side-menu[side='left']").clientWidth;
          if (screen.orientation.includes('portrait')) {
            // Portrait
            document.querySelector("ion-side-menu-content").style.width = (screen.width - leftMenuWidth) + "px";
          } else {
            // Landscape
            document.querySelector("ion-side-menu-content").style.width = (screen.height - leftMenuWidth) + "px";
          }
        });
      }
    } else {
      if (screen.width >= 768) {
        window.addEventListener('resize', lodash.throttle(function() {
          $rootScope.$emit('Local/WindowResize');
        }, 100));
      }
    }

    $ionicPlatform.ready(function() {
      if (platformInfo.isCordova) {

        window.addEventListener('native.keyboardhide', function() {
          $timeout(function() {
            $rootScope.shouldHideMenuBar = false; //show menu bar when keyboard is hidden with back button action on send screen
          }, 100);
        });

        window.addEventListener('native.keyboardshow', function() {
          $timeout(function() {
            $rootScope.shouldHideMenuBar = true; //hide menu bar when keyboard opens with back button action on send screen
          }, 300);
        });

        if (window.cordova.plugins.Keyboard) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
          cordova.plugins.Keyboard.disableScroll(false);
        }

        $ionicPlatform.registerBackButtonAction(function(event) {
          event.preventDefault();
        }, 100);

        var secondBackButtonPress = false;
        var intval = setInterval(function() {
          secondBackButtonPress = false;
        }, 5000);

        $ionicPlatform.on('pause', function() {
          // Nothing to do
        });

        $ionicPlatform.on('resume', function() {
          $rootScope.$emit('Local/Resume');
        });

        $ionicPlatform.on('backbutton', function(event) {

          var loc = window.location;
          var fromDisclaimer = loc.toString().match(/disclaimer/) ? 'true' : '';
          var fromHome = loc.toString().match(/index\.html#\/$/) ? 'true' : '';

          if (fromDisclaimer == 'true')
            navigator.app.exitApp();

          if (platformInfo.isMobile && fromHome == 'true') {
            if (secondBackButtonPress)
              navigator.app.exitApp();
            else
              window.plugins.toast.showShortBottom(gettextCatalog.getString('Press again to exit'));
          }

          if (secondBackButtonPress)
            clearInterval(intval);
          else
            secondBackButtonPress = true;

          $timeout(function() {
            $rootScope.$emit('Local/SetTab', 'walletHome', true);
          }, 100);

          go.walletHome();
        });

        $ionicPlatform.on('menubutton', function() {
          window.location = '#/preferences';
        });

        setTimeout(function() {
          navigator.splashscreen.hide();
        }, 1000);
      }
    });

    uxLanguage.init();

    if (platformInfo.isNW) {
      var gui = require('nw.gui');
      var win = gui.Window.get();
      var nativeMenuBar = new gui.Menu({
        type: "menubar"
      });
      try {
        nativeMenuBar.createMacBuiltin("Copay");
      } catch (e) {
        $log.debug('This is not OSX');
      }
      win.menu = nativeMenuBar;
    }

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      $log.debug('Route change from:', fromState.name || '-', ' to:', toState.name);
      $log.debug('            toParams:' + JSON.stringify(toParams || {}));
      $log.debug('            fromParams:' + JSON.stringify(fromParams || {}));

      if (!instanceConfig.assets && toState.name !== 'walletHome') {
        $state.get('walletHome').needProfile = false;
        $state.transitionTo('walletHome');
        event.preventDefault();
        return;
      }

      if (!profileService.profile && toState.needProfile) {

        // Give us time to open / create the profile
        event.preventDefault();
        // Try to open local profile
        profileService.loadAndBindProfile(function(err) {
          if (err) {
            if (err.message && err.message.match('NOPROFILE')) {
              $log.debug('No profile... redirecting');
              $state.transitionTo('disclaimer');
            } else if (err.message && err.message.match('NONAGREEDDISCLAIMER')) {
              $log.debug('Display disclaimer... redirecting');
              $state.transitionTo('disclaimer');
            } else {
              throw new Error(err); // TODO
            }
          } else {
            profileService.storeProfileIfDirty();
            $log.debug('Profile loaded ... Starting UX.');
            $state.transitionTo(toState.name || toState, toParams);
          }
        });
      } else {
        if (profileService.focusedClient && !profileService.focusedClient.isComplete() && toState.walletShouldBeComplete) {

          $state.transitionTo('copayers');
        }
      }
    });
  });

'use strict';

function selectText(element) {
  var doc = document;
  if (doc.body.createTextRange) { // ms
    var range = doc.body.createTextRange();
    range.moveToElementText(element);
    range.select();
  } else if (window.getSelection) {
    var selection = window.getSelection();
    var range = doc.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);

  }
}
angular.module('copayApp.directives')
  .directive('validAddress', ['$rootScope', 'bitcore', 'profileService',
    function($rootScope, bitcore, profileService) {
      return {
        require: 'ngModel',
        link: function(scope, elem, attrs, ctrl) {
          var URI = bitcore.URI;
          var Address = bitcore.Address
          var validator = function(value) {
            if (!profileService.focusedClient)
              return;
            var networkName = profileService.focusedClient.credentials.network;
            // Regular url
            if (/^https?:\/\//.test(value)) {
              ctrl.$setValidity('validAddress', true);
              return value;
            }

            // Bip21 uri
            if (/^bitcoin:/.test(value)) {
              var uri, isAddressValid;
              var isUriValid = URI.isValid(value);
              if (isUriValid) {
                uri = new URI(value);
                isAddressValid = Address.isValid(uri.address.toString(), networkName)
              }
              ctrl.$setValidity('validAddress', isUriValid && isAddressValid);
              return value;
            }

            if (typeof value == 'undefined') {
              ctrl.$pristine = true;
              return;
            }

            // Regular Address
            ctrl.$setValidity('validAddress', Address.isValid(value, networkName));
            return value;
          };


          ctrl.$parsers.unshift(validator);
          ctrl.$formatters.unshift(validator);
        }
      };
    }
  ])
  .directive('validUrl', [

    function() {
      return {
        require: 'ngModel',
        link: function(scope, elem, attrs, ctrl) {
          var validator = function(value) {
            // Regular url
            if (/^https?:\/\//.test(value)) {
              ctrl.$setValidity('validUrl', true);
              return value;
            } else {
              ctrl.$setValidity('validUrl', false);
              return value;
            }
          };

          ctrl.$parsers.unshift(validator);
          ctrl.$formatters.unshift(validator);
        }
      };
    }
  ])
  .directive('validAmount', ['configService',
    function(configService) {

      return {
        require: 'ngModel',
        link: function(scope, element, attrs, ctrl) {
          var val = function(value) {
            var settings = configService.getSync().wallet.settings;
            var vNum;
            if (attrs.unitDecimals) {
              vNum = Number(value);
            } else {
              vNum = Number((value * settings.unitToSatoshi).toFixed(0));
            }

            if (typeof value == 'undefined' || value == 0) {
              ctrl.$pristine = true;
            }

            if (typeof vNum == "number" && vNum > 0) {
              if (vNum > Number.MAX_SAFE_INTEGER) {
                ctrl.$setValidity('validAmount', false);
              } else {
                var decimals = Number(attrs.unitDecimals || settings.unitDecimals);
                var sep_index = ('' + value).indexOf('.');
                var str_value = ('' + value).substring(sep_index + 1);
                if (sep_index >= 0 && str_value.length > decimals) {
                  ctrl.$setValidity('validAmount', false);
                  return;
                } else {
                  ctrl.$setValidity('validAmount', true);
                }
              }
            } else {
              ctrl.$setValidity('validAmount', false);
            }
            return value;
          }
          ctrl.$parsers.unshift(val);
          ctrl.$formatters.unshift(val);
        }
      };
    }
  ])
  .directive('walletSecret', function(bitcore) {
    return {
      require: 'ngModel',
      link: function(scope, elem, attrs, ctrl) {
        var validator = function(value) {
          if (value.length > 0) {
            var m = value.match(/^[0-9A-HJ-NP-Za-km-z]{70,80}$/);
            ctrl.$setValidity('walletSecret', m ? true : false);
          }
          return value;
        };

        ctrl.$parsers.unshift(validator);
      }
    };
  })
  .directive('loading', function() {
    return {
      restrict: 'A',
      link: function($scope, element, attr) {
        var a = element.html();
        var text = attr.loading;
        element.on('click', function() {
          element.html('<i class="size-21 fi-bitcoin-circle icon-rotate spinner"></i> ' + text + '...');
        });
        $scope.$watch('loading', function(val) {
          if (!val) {
            element.html(a);
          }
        });
      }
    }
  })
  .directive('ngFileSelect', function() {
    return {
      link: function($scope, el) {
        el.bind('change', function(e) {
          $scope.file = (e.srcElement || e.target).files[0];
          $scope.getFile();
        });
      }
    }
  })
  .directive('contact', ['addressbookService',
    function(addressbookService) {
      return {
        restrict: 'E',
        link: function(scope, element, attrs) {
          var addr = attrs.address;
          addressbookService.getLabel(addr, function(label) {
            if (label) {
              element.append(label);
            } else {
              element.append(addr);
            }
          });
        }
      };
    }
  ])
  .directive('highlightOnChange', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        scope.$watch(attrs.highlightOnChange, function(newValue, oldValue) {
          element.addClass('highlight');
          setTimeout(function() {
            element.removeClass('highlight');
          }, 500);
        });
      }
    }
  })
  .directive('checkStrength', function() {
    return {
      replace: false,
      restrict: 'EACM',
      require: 'ngModel',
      link: function(scope, element, attrs) {

        var MIN_LENGTH = 8;
        var MESSAGES = ['Very Weak', 'Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
        var COLOR = ['#dd514c', '#dd514c', '#faa732', '#faa732', '#16A085', '#16A085'];

        function evaluateMeter(password) {
          var passwordStrength = 0;
          var text;
          if (password.length > 0) passwordStrength = 1;
          if (password.length >= MIN_LENGTH) {
            if ((password.match(/[a-z]/)) && (password.match(/[A-Z]/))) {
              passwordStrength++;
            } else {
              text = ', add mixed case';
            }
            if (password.match(/\d+/)) {
              passwordStrength++;
            } else {
              if (!text) text = ', add numerals';
            }
            if (password.match(/.[!,@,#,$,%,^,&,*,?,_,~,-,(,)]/)) {
              passwordStrength++;
            } else {
              if (!text) text = ', add punctuation';
            }
            if (password.length > 12) {
              passwordStrength++;
            } else {
              if (!text) text = ', add characters';
            }
          } else {
            text = ', that\'s short';
          }
          if (!text) text = '';

          return {
            strength: passwordStrength,
            message: MESSAGES[passwordStrength] + text,
            color: COLOR[passwordStrength]
          }
        }

        scope.$watch(attrs.ngModel, function(newValue, oldValue) {
          if (newValue && newValue !== '') {
            var info = evaluateMeter(newValue);
            scope[attrs.checkStrength] = info;
          }
        });
      }
    };
  })
  .directive('showFocus', function($timeout) {
    return function(scope, element, attrs) {
      scope.$watch(attrs.showFocus,
        function(newValue) {
          $timeout(function() {
            newValue && element[0].focus();
          });
        }, true);
    };
  })
  .directive('match', function() {
    return {
      require: 'ngModel',
      restrict: 'A',
      scope: {
        match: '='
      },
      link: function(scope, elem, attrs, ctrl) {
        scope.$watch(function() {
          return (ctrl.$pristine && angular.isUndefined(ctrl.$modelValue)) || scope.match === ctrl.$modelValue;
        }, function(currentValue) {
          ctrl.$setValidity('match', currentValue);
        });
      }
    };
  })
  .directive('clipCopy', function() {
    return {
      restrict: 'A',
      scope: {
        clipCopy: '=clipCopy'
      },
      link: function(scope, elm) {
        // TODO this does not work (FIXME)
        elm.attr('tooltip', 'Press Ctrl+C to Copy');
        elm.attr('tooltip-placement', 'top');

        elm.bind('click', function() {
          selectText(elm[0]);
        });
      }
    };
  })
  .directive('menuToggle', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/includes/menu-toggle.html'
    }
  })
  .directive('logo', function() {
    return {
      restrict: 'E',
      scope: {
        width: "@"
      },
      controller: function($scope, instanceConfig) {
        $scope.logo_url = instanceConfig.logo || 'img/logo-negative.svg';
        if ($scope.width) {
          var logo_width = $scope.width * 1.5;
          var logo_height = logo_width / (220 / 43);
          $scope.copay_logo_style = 'width: ' + $scope.width + 'px;';
          $scope.logo_style = "background-size: " + logo_width + "px " + logo_height + "px;" +
              "width: " + logo_width + "px; height: " + logo_height + "px;";
        } else {
          var copay_width = 100 / 1.5 + '%';
          $scope.copay_logo_style = 'width: ' + copay_width + '%; max-width: 147px';
          $scope.logo_style = "background-size: 100% auto; width: 100%; max-width: 220px; height: 43px;";
        }
      },
      replace: true,
      template: '' +
          '<div class="cc-logo-holder" ng-class="{ \'negative\' : negative, \'inline\' : width < 50, }">' +
            '<img ng-src="{{ logo_url }}" alt="Copay" style="{{ copay_logo_style }}">' +
            '<div class="cc-plus">+</div>' +
            '<div class="cc-logo" style="{{ logo_style }}"></div>' +
          '</div>'
    }
  })
  .directive('availableBalance', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/includes/available-balance.html'
    }
  })
  .directive('ignoreMouseWheel', function($rootScope, $timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.bind('mousewheel', function(event) {
          element[0].blur();
          $timeout(function() {
            element[0].focus();
          }, 1);
        });
      }
    }
  });

'use strict';

angular.module('copayApp.directives')
  .directive('qrScanner', function($rootScope, $timeout, $ionicModal, gettextCatalog, platformInfo) {

    var isCordova = platformInfo.isCordova;
    var isWP = platformInfo.isWP;
    var isIOS = platformInfo.isIOS;

    var controller = function($scope) {

      var onSuccess = function(result) {
        $timeout(function() {
          window.plugins.spinnerDialog.hide();
        }, 100);
        if (isWP && result.cancelled) return;

        $timeout(function() {
          var data = isIOS ? result : result.text;
          $scope.onScan({
            data: data
          });
        }, 1000);
      };

      var onError = function(error) {
        $timeout(function() {
          window.plugins.spinnerDialog.hide();
        }, 100);
      };

      $scope.cordovaOpenScanner = function() {
        window.plugins.spinnerDialog.show(null, gettextCatalog.getString('Preparing camera...'), true);
        $timeout(function() {
          if (isIOS) {
            cloudSky.zBar.scan({}, onSuccess, onError);
          } else {
            cordova.plugins.barcodeScanner.scan(onSuccess, onError);
          }
          if ($scope.beforeScan) {
            $scope.beforeScan();
          }
        }, 100);
      };

      $scope.modalOpenScanner = function() {
        $ionicModal.fromTemplateUrl('views/modals/scanner.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.scannerModal = modal;
          $scope.scannerModal.show();
        });
      };

      $scope.openScanner = function() {
        if (isCordova) {
          $scope.cordovaOpenScanner();
        } else {
          $scope.modalOpenScanner();
        }
      };
    };

    return {
      restrict: 'E',
      scope: {
        onScan: "&",
        beforeScan: "&"
      },
      controller: controller,
      replace: true,
      template: '<a id="camera-icon" class="p10" ng-click="openScanner()"><i class="icon-scan size-21"></i></a>'
    }
  });

'use strict';

angular.module('copayApp.filters', [])
  .filter('amTimeAgo', ['amMoment',
    function(amMoment) {
      return function(input) {
        return amMoment.preprocessDate(input).fromNow();
      };
    }
  ])
  .filter('paged', function() {
    return function(elements) {
      if (elements) {
        return elements.filter(Boolean);
      }

      return false;
    };
  })
  .filter('removeEmpty', function() {
    return function(elements) {
      elements = elements || [];
      // Hide empty change addresses from other copayers
      return elements.filter(function(e) {
        return !e.isChange || e.balance > 0;
      });
    }
  })
  .filter('formatFiatAmount', ['$filter', '$locale', 'configService',
    function(filter, locale, configService) {
      var numberFilter = filter('number');
      var formats = locale.NUMBER_FORMATS;
      var config = configService.getSync().wallet.settings;
      return function(amount) {
        if (!config) return amount;

        var fractionSize = 2;
        var value = numberFilter(amount, fractionSize);
        var sep = value.indexOf(formats.DECIMAL_SEP);
        var group = value.indexOf(formats.GROUP_SEP);

        if (amount >= 0) {
          if (group > 0) {
            if (sep < 0) {
              return value;
            }
            var intValue = value.substring(0, sep);
            var floatValue = parseFloat(value.substring(sep));
            floatValue = floatValue.toFixed(2);
            floatValue = floatValue.toString().substring(1);
            var finalValue = intValue + floatValue;
            return finalValue;
          } else {
            value = parseFloat(value);
            return value.toFixed(2);
          }
        }
        return 0;
      };
    }
  ])
  .filter('orderObjectBy', function() {
    return function(items, field, reverse) {
      var filtered = [];
      angular.forEach(items, function(item) {
        filtered.push(item);
      });
      filtered.sort(function(a, b) {
        return (a[field] > b[field] ? 1 : -1);
      });
      if (reverse) filtered.reverse();
      return filtered;
    };
  })
  .filter('rawHtml', function(){
    return function(val) {
      return val ? he.decode(val) : val;
    };
  });

'use strict';

/**
 * Profile
 *
 * credential: array of OBJECTS
 */
function Profile() {
  this.version = '1.0.0';
};

Profile.create = function(opts) {
  opts = opts || {};

  var x = new Profile();
  x.createdOn = Date.now();
  x.credentials = opts.credentials || [];
  x.disclaimerAccepted = false;
  x.checked = {};
  return x;
};

Profile.fromObj = function(obj) {
  var x = new Profile();

  x.createdOn = obj.createdOn;
  x.credentials = obj.credentials;
  x.disclaimerAccepted = obj.disclaimerAccepted;
  x.checked = obj.checked || {};
  x.checkedUA = obj.checkedUA || {};

  if (x.credentials[0] && typeof x.credentials[0] != 'object')
    throw ("credentials should be an object");

  return x;
};

Profile.fromString = function(str) {
  return Profile.fromObj(JSON.parse(str));
};

Profile.prototype.toObj = function() {
  delete this.dirty;
  return JSON.stringify(this);
};


Profile.prototype.hasWallet = function(walletId) {
  for (var i in this.credentials) {
    var c = this.credentials[i];
    if (c.walletId == walletId) return true;
  };
  return false;
};

Profile.prototype.isChecked = function(ua, walletId) {
  return !!(this.checkedUA == ua && this.checked[walletId]);
};


Profile.prototype.isDeviceChecked = function(ua) {
  return this.checkedUA == ua;
};


Profile.prototype.setChecked = function(ua, walletId) {
  if (this.checkedUA != ua) {
    this.checkedUA = ua;
    this.checked = {};
  }
  this.checked[walletId] = true;
  this.dirty = true;
};


Profile.prototype.addWallet = function(credentials) {
  if (!credentials.walletId)
    throw 'credentials must have .walletId';

  if (this.hasWallet(credentials.walletId))
    return false;

  this.credentials.push(credentials);
  this.dirty = true;
  return true;
};

Profile.prototype.updateWallet = function(credentials) {
  if (!credentials.walletId)
    throw 'credentials must have .walletId';

  if (!this.hasWallet(credentials.walletId))
    return false;

  this.credentials = this.credentials.map(function(c) {
    if(c.walletId != credentials.walletId ) {
      return c;
    } else {
      return credentials
    }
  });

  this.dirty = true;
  return true;
};

Profile.prototype.deleteWallet = function(walletId) {
  if (!this.hasWallet(walletId))
    return false;

  this.credentials = this.credentials.filter(function(c) {
    return c.walletId != walletId;
  });

  this.dirty = true;
  return true;
};

'use strict';

angular.module('copayApp.services').service('addonManager', function (lodash) {
  var addons = [];

  this.registerAddon = function (addonSpec) {
    addons.push(addonSpec);
  };

  this.addonMenuItems = function () {
    return lodash.map(addons, function (addonSpec) {
      return addonSpec.menuItem;
    });
  };

  this.addonViews = function () {
    return lodash.map(addons, function (addonSpec) {
      return addonSpec.view;
    });
  };

  this.formatPendingTxp = function (txp) {
    lodash.each(addons, function (addon) {
      if (addon.formatPendingTxp) {
        addon.formatPendingTxp(txp);
      }
    });
  };

  this.txTemplateUrl = function() {
    var addon = lodash.find(addons, 'txTemplateUrl');
    return addon ? addon.txTemplateUrl() : null;
  }
  
  this.processCreateTxOpts = function(txOpts) {
    lodash.each(addons, function (addon) {
      if (addon.processCreateTxOpts) {
        addon.processCreateTxOpts(txOpts);
      }
    });
    return txOpts;
  };

});

'use strict';

angular.module('copayApp.services').factory('addressbookService', function(storageService, profileService) {
  var root = {};

  root.getLabel = function(addr, cb) {
    var fc = profileService.focusedClient;
    storageService.getAddressbook(fc.credentials.network, function(err, ab) {
      if (!ab) return cb();
      ab = JSON.parse(ab);
      if (ab[addr]) return cb(ab[addr]);
      else return cb();
    });
  };

  root.list = function(cb) {
    var fc = profileService.focusedClient;
    storageService.getAddressbook(fc.credentials.network, function(err, ab) {
      if (err) return cb('Could not get the Addressbook');
      if (ab) ab = JSON.parse(ab);
      return cb(err, ab);
    });
  };

  root.add = function(entry, cb) {
    var fc = profileService.focusedClient;
    root.list(function(err, ab) {
      if (err) return cb(err);
      if (!ab) ab = {};
      if (ab[entry.address]) return cb('Entry already exist');
      ab[entry.address] = entry.label;
      storageService.setAddressbook(fc.credentials.network, JSON.stringify(ab), function(err, ab) {
        if (err) return cb('Error adding new entry');
        root.list(function(err, ab) {
          return cb(err, ab);
        });
      });
    });
  };
  
  root.remove = function(addr, cb) {
    var fc = profileService.focusedClient;
    root.list(function(err, ab) {
      if (err) return cb(err);
      if (!ab) return;
      if (!ab[addr]) return cb('Entry does not exist');
      delete ab[addr];
      storageService.setAddressbook(fc.credentials.network, JSON.stringify(ab), function(err) {
        if (err) return cb('Error deleting entry');
        root.list(function(err, ab) {
          return cb(err, ab);
        });
      });
    }); 
  };

  root.removeAll = function() {
    var fc = profileService.focusedClient;
    storageService.removeAddressbook(fc.credentials.network, function(err) {
      if (err) return cb('Error deleting addressbook');
      return cb();
    });
  };

  return root;
});

'use strict';
angular.module('copayApp.services')
  .factory('addressService', function(storageService, profileService, $log, $timeout, lodash, bwcError, gettextCatalog) {
    var root = {};

    root.expireAddress = function(walletId, cb) {
      $log.debug('Cleaning Address ' + walletId);
      storageService.clearLastAddress(walletId, function(err) {
        return cb(err);
      });
    };

    root.isUsed = function(walletId, byAddress, cb) {
      storageService.getLastAddress(walletId, function(err, addr) {
        var used = lodash.find(byAddress, {
          address: addr
        });
        return cb(null, used);
      });
    };

    root._createAddress = function(walletId, cb) {
      var client = profileService.getClient(walletId);

      $log.debug('Creating address for wallet:', walletId);

      client.createAddress({}, function(err, addr) {
        if (err) {
          var prefix = gettextCatalog.getString('Could not create address');
          if (err.error && err.error.match(/locked/gi)) {
            $log.debug(err.error);
            return $timeout(function() {
              root._createAddress(walletId, cb);
            }, 5000);
          } else if (err.message && err.message == 'MAIN_ADDRESS_GAP_REACHED') {
            $log.warn(err.message);
            prefix = null;
            client.getMainAddresses({
              reverse: true,
              limit: 1
            }, function(err, addr) {
              if (err) return cb(err);
              return cb(null, addr[0].address);
            });
          }
          return bwcError.cb(err, prefix, cb);
        }
        return cb(null, addr.address);
      });
    };

    root.getAddress = function(walletId, forceNew, cb) {

      var firstStep;
      if (forceNew) {
        firstStep = storageService.clearLastAddress;
      } else {
        firstStep = function(walletId, cb) {
          return cb();
        };
      }

      firstStep(walletId, function(err) {
        if (err) return cb(err);

        storageService.getLastAddress(walletId, function(err, addr) {
          if (err) return cb(err);

          if (addr) return cb(null, addr);

          root._createAddress(walletId, function(err, addr) {
            if (err) return cb(err);
            storageService.storeLastAddress(walletId, addr, function() {
              if (err) return cb(err);
              return cb(null, addr);
            });
          });
        });
      });
    };

    return root;
  });

'use strict';
angular.module('copayApp.services').factory('amazonService', function($http, $log, lodash, moment, storageService, configService, platformInfo) {
  var root = {};
  var credentials = {};

  var _setCredentials = function() {
    /*
     * Development: 'testnet'
     * Production: 'livenet'
     */
    credentials.NETWORK = 'livenet';

    if (credentials.NETWORK == 'testnet') {
      credentials.BITPAY_API_URL = "https://test.bitpay.com";
    } else {
      credentials.BITPAY_API_URL = "https://bitpay.com";
    };
  };

  var _getBitPay = function(endpoint) {
    _setCredentials();
    return {
      method: 'GET',
      url: credentials.BITPAY_API_URL + endpoint,
      headers: {
        'content-type': 'application/json'
      }
    };
  };

  var _postBitPay = function(endpoint, data) {
    _setCredentials();
    return {
      method: 'POST',
      url: credentials.BITPAY_API_URL + endpoint,
      headers: {
        'content-type': 'application/json'
      },
      data: data
    };
  };

  root.getEnvironment = function() {
    _setCredentials();
    return credentials.NETWORK;
  };

  root.savePendingGiftCard = function(gc, opts, cb) {
    var network = root.getEnvironment();
    storageService.getAmazonGiftCards(network, function(err, oldGiftCards) {
      if (lodash.isString(oldGiftCards)) {
        oldGiftCards = JSON.parse(oldGiftCards);
      }
      if (lodash.isString(gc)) {
        gc = JSON.parse(gc);
      }
      var inv = oldGiftCards || {};
      inv[gc.invoiceId] = gc;
      if (opts && (opts.error || opts.status)) {
        inv[gc.invoiceId] = lodash.assign(inv[gc.invoiceId], opts);
      }
      if (opts && opts.remove) {
        delete(inv[gc.invoiceId]);
      }
      inv = JSON.stringify(inv);

      storageService.setAmazonGiftCards(network, inv, function(err) {
        return cb(err);
      });
    });
  };

  root.getPendingGiftCards = function(cb) {
    var network = root.getEnvironment();
    storageService.getAmazonGiftCards(network, function(err, giftCards) {
      var _gcds = giftCards ? JSON.parse(giftCards) : null;
      return cb(err, _gcds);
    });
  };

  root.createBitPayInvoice = function(data, cb) {

    var dataSrc = {
      currency: data.currency,
      amount: data.amount,
      clientId: data.uuid
    };

    $http(_postBitPay('/amazon-gift/pay', dataSrc)).then(function(data) {
      $log.info('BitPay Create Invoice: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('BitPay Create Invoice: ERROR ' + data.data.message);
      return cb(data.data);
    });
  };

  root.getBitPayInvoice = function(id, cb) {
    $http(_getBitPay('/invoices/' + id)).then(function(data) {
      $log.info('BitPay Get Invoice: SUCCESS');
      return cb(null, data.data.data);
    }, function(data) {
      $log.error('BitPay Get Invoice: ERROR ' + data.data.error);
      return cb(data.data.error);
    });
  };

  root.createGiftCard = function(data, cb) {

    var dataSrc = {
      "clientId": data.uuid,
      "invoiceId": data.invoiceId,
      "accessKey": data.accessKey
    };

    $http(_postBitPay('/amazon-gift/redeem', dataSrc)).then(function(data) {
      var status = data.data.status == 'new' ? 'PENDING' : (data.data.status == 'paid') ? 'PENDING' : data.data.status;
      data.data.status = status;
      $log.info('Amazon.com Gift Card Create/Update: ' + status);
      return cb(null, data.data);
    }, function(data) {
      $log.error('Amazon.com Gift Card Create/Update: ' + data.data.message);
      return cb(data.data);
    });
  };

  root.cancelGiftCard = function(data, cb) {

    var dataSrc = {
      "clientId": data.uuid,
      "invoiceId": data.invoiceId,
      "accessKey": data.accessKey
    };

    $http(_postBitPay('/amazon-gift/cancel', dataSrc)).then(function(data) {
      $log.info('Amazon.com Gift Card Cancel: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Amazon.com Gift Card Cancel: ' + data.data.message);
      return cb(data.data);
    });
  };

  return root;

});

'use strict';
angular.module('copayApp.services')
  .factory('applicationService', function($rootScope, $timeout, platformInfo, go) {
    var root = {};

    var isChromeApp  = platformInfo.isChromeApp;
    var isNW  = platformInfo.isNW;

    root.restart = function() {
      var hashIndex = window.location.href.indexOf('#/');
      if (platformInfo.isCordova) {
        window.location = window.location.href.substr(0, hashIndex);
        $timeout(function() {
          $rootScope.$digest();
        }, 1);

      } else {
        // Go home reloading the application
        if (isChromeApp) {
          chrome.runtime.reload();
        } else if (isNW) {
          go.walletHome();
          $timeout(function() {
            var win = require('nw.gui').Window.get();
            win.reload(3);
            //or
            win.reloadDev();
          }, 100);
        } else {
          window.location = window.location.href.substr(0, hashIndex);
        }
      }
    };

    return root;
  });

'use strict';

angular.module('copayApp.services').factory('assetService',
  function(profileService, coloredCoins, addonManager, lodash, configService,
          $q, $log, $rootScope, go, instanceConfig, walletService, $timeout, storageService) {

  var root = {},
      self = this,
      selectedAssetId,
      btcAsset = {
        assetId: 'bitcoin',
        isAsset: false
      };

  root.btcBalance = null;

  root.walletAsset = {
    isAsset: false
  };

  $rootScope.$on('ColoredCoins/AssetsUpdated', function() {
    root.updateWalletAsset();
  });

  var getZeroAsset = function(assetId) {
    var unitSymbol = coloredCoins.getAssetSymbol(assetId, null);
    var balanceStr = coloredCoins.formatAssetAmount(0, null, unitSymbol);

    return {
      assetId: assetId,
      unitSymbol: unitSymbol,
      balanceStr: balanceStr,
      availableBalance: 0,
      availableBalanceStr: balanceStr,
      divisibility: 0
    };
  };

  var getBtcAsset = function(assetId) {
    var unitSymbol = coloredCoins.getAssetSymbol(assetId, asset);
    var balanceStr = coloredCoins.formatAssetAmount(0, null, unit);

    return {
      assetId: assetId,
      isAsset: false
    };
  };

  var updateAssetBalance = function() {
    if (!self.selectedAssetId) { return {}; }

    var isAsset = self.selectedAssetId !== btcAsset.assetId,
        asset, unit, balanceStr;

    if (isAsset) {
      var asset = lodash.find(coloredCoins.assets, function(asset) {
         return asset.assetId == self.selectedAssetId;
       });

       if (!asset) {
          asset = getZeroAsset(self.selectedAssetId);
       }
       asset.isAsset = isAsset;
     } else {
       asset = btcAsset;
     }

     root.walletAsset = asset;
     $rootScope.$emit("Local/WalletAssetUpdated", root.walletAsset);
     return root.walletAsset;
  };

  root.setBtcBalance = function(btcBalance) {
    root.btcBalance = btcBalance;
  };

  root.updateWalletAsset = function() {
    if (self.selectedAssetId) return updateAssetBalance();

    var walletId = profileService.focusedClient.credentials.walletId,
        config = configService.getSync();

    config.assetFor = config.assetFor || {};
    root.getSupportedAssets(function(assets) {
      var supportedAssets = lodash.map(assets, 'assetId');
      var selectedAsset = config.assetFor[walletId];
      if (!selectedAsset || supportedAssets.indexOf(selectedAsset) === -1) {
        self.selectedAssetId = instanceConfig.defaultAsset;
      } else {
        self.selectedAssetId = config.assetFor[walletId];
      }
      updateAssetBalance();
    });
  };

  root.getSupportedAssets = function(cb) {
    storageService.getCustomAssets(function(err, customAssets) {
      if (!customAssets) return cb(instanceConfig.assets);
      cb(lodash(instanceConfig.assets).concat(customAssets).value());
    });
  };

  root.setSelectedAsset = function(assetId) {
    var walletId = profileService.focusedClient.credentials.walletId;

    var opts = {
      assetFor: {
      }
    };
    opts.assetFor[walletId] = assetId;
    self.selectedAssetId = assetId;

    configService.set(opts, function(err) {
      if (err) $log.warn(err);
      updateAssetBalance();
      go.walletHome();
    });
  };

  root.getNormalizedAmount = function(amount) {
    if (root.walletAsset.isAsset) {
      return (amount * Math.pow(10, root.walletAsset.divisibility)).toFixed(0);
    } else {
      var unitToSat = configService.getSync().wallet.settings.unitToSatoshi;
      return parseInt((amount * unitToSat).toFixed(0));
    }
  };

  root.createTransferTx = function(client, txp, cb) {
    if (root.walletAsset.isAsset) {
      return coloredCoins.makeTransferTxProposal(txp.amount, txp.toAddress, txp.message, root.walletAsset, function(err, coloredTxp) {
        if (err) return cb(err);

        client.createTxProposal(coloredTxp, function(err, createdTxp) {
          if (err) {
            return cb(err);
          } else {
            $log.debug('Transaction created');
            return cb(null, createdTxp);
          }
        });
      });
    } else {
      return walletService.createTx(client, addonManager.processCreateTxOpts(txp), cb);
    }
  };

  root.broadcastTx = function(client, txp, cb) {
    if (root.walletAsset.isAsset) {
      return coloredCoins.broadcastTx(txp.raw, txp.customData.financeTxId, function(err) {
        if (err) return cb(err);
        $timeout(function() {
          walletService.broadcastTx(client, txp, cb);
        }, 1000);
      });
    } else {
      return walletService.broadcastTx(client, txp, cb);
    }
  };

  root.addCustomAsset = function(newAsset, cb) {
    storageService.getCustomAssets(function(err, customAssets) {
      customAssets = customAssets || [];
      coloredCoins.getAssetData(newAsset.assetId, function(err, assetData) {
        if (err) return cb(err);
        if (!assetData.metadataOfIssuence) return cb('No such asset found');
        newAsset['name'] = assetData.metadataOfIssuence.data.assetName;
        customAssets.push(newAsset);
        $log.debug('Adding new custom asset: ' + JSON.stringify(newAsset))
        storageService.setCustomAssets(customAssets, cb);
      });
    });
  };

  root.removeCustomAsset = function(assetId, cb) {
    storageService.getCustomAssets(function(err, customAssets) {
      customAssets = customAssets || [];
      $log.debug('Removing custom asset: ' + assetId);
      customAssets = lodash.reject(customAssets, function(a) { return a.assetId === assetId });
      storageService.setCustomAssets(customAssets, cb);
    });
  };

  root.setSupportedAssets = function(cb) {
    root.getSupportedAssets(function(assets) {
      coloredCoins.setSupportedAssets(assets);
      if (cb) cb();
    });
  };

  root.setSupportedAssets();

  return root;
});

'use strict';
angular.module('copayApp.services')
  .factory('backupService', function backupServiceFactory($log, $timeout, profileService, sjcl) {

    var root = {};

    var _download = function(ew, filename, cb) {
      var NewBlob = function(data, datatype) {
        var out;

        try {
          out = new Blob([data], {
            type: datatype
          });
          $log.debug("case 1");
        } catch (e) {
          window.BlobBuilder = window.BlobBuilder ||
            window.WebKitBlobBuilder ||
            window.MozBlobBuilder ||
            window.MSBlobBuilder;

          if (e.name == 'TypeError' && window.BlobBuilder) {
            var bb = new BlobBuilder();
            bb.append(data);
            out = bb.getBlob(datatype);
            $log.debug("case 2");
          } else if (e.name == "InvalidStateError") {
            // InvalidStateError (tested on FF13 WinXP)
            out = new Blob([data], {
              type: datatype
            });
            $log.debug("case 3");
          } else {
            // We're screwed, blob constructor unsupported entirely
            $log.debug("Error");
          }
        }
        return out;
      };

      var a = angular.element('<a></a>');
      var blob = new NewBlob(ew, 'text/plain;charset=utf-8');
      a.attr('href', window.URL.createObjectURL(blob));
      a.attr('download', filename);
      a[0].click();
      return cb();
    };

    root.addMetadata = function(b, opts) {

      b = JSON.parse(b);
      if (opts.addressBook) b.addressBook = opts.addressBook;
      return JSON.stringify(b);
    }

    root.walletExport = function(password, opts) {
      if (!password) {
        return null;
      }
      var fc = profileService.focusedClient;
      try {
        opts = opts || {};
        var b = fc.export(opts);
        if (opts.addressBook) b = root.addMetadata(b, opts);

        var e = sjcl.encrypt(password, b, {
          iter: 10000
        });
        return e;
      } catch (err) {
        $log.debug('Error exporting wallet: ', err);
        return null;
      };
    };

    root.walletDownload = function(password, opts, cb) {
      var fc = profileService.focusedClient;
      var ew = root.walletExport(password, opts);
      if (!ew) return cb('Could not create backup');

      var walletName = (fc.alias || '') + (fc.alias ? '-' : '') + fc.credentials.walletName;
      if (opts.noSign) walletName = walletName + '-noSign'
      var filename = walletName + '-Copaybackup.aes.json';
      _download(ew, filename, cb)
    };
    return root;
  });

'use strict';
angular.module('copayApp.services')
  .factory('bitcore', function bitcoreFactory(bwcService) {
    var bitcore = bwcService.getBitcore();
    return bitcore;
  });

'use strict';
angular.module('copayApp.services')
  .factory('bwcError', function bwcErrorService($log, gettextCatalog) {
    var root = {};

    root.msg = function(err, prefix) {
      if (!err)
        return 'Unknown error';

      var name;

      if (err.name) {
        if (err.name == 'Error')
          name = err.message
        else
          name = err.name.replace(/^bwc.Error/g, '');
      } else
        name = err;

      var body = '';
      prefix = prefix || '';

      if (name) {
        switch (name) {
          case 'INVALID_BACKUP':
            body = gettextCatalog.getString('Wallet Recovery Phrase is invalid');
            break;
          case 'WALLET_DOES_NOT_EXIST':
            body = gettextCatalog.getString('Wallet not registered at the wallet service. Recreate it from "Create Wallet" using "Advanced Options" to set your recovery phrase');
            break;
          case 'MISSING_PRIVATE_KEY':
            body = gettextCatalog.getString('Missing private keys to sign');
            break;
          case 'ENCRYPTED_PRIVATE_KEY':
            body = gettextCatalog.getString('Private key is encrypted, cannot sign');
            break;
          case 'SERVER_COMPROMISED':
            body = gettextCatalog.getString('Server response could not be verified');
            break;
          case 'COULD_NOT_BUILD_TRANSACTION':
            body = gettextCatalog.getString('Could not build transaction');
            break;
          case 'INSUFFICIENT_FUNDS':
            body = gettextCatalog.getString('Insufficient funds');
            break;
          case 'CONNECTION_ERROR':
            body = gettextCatalog.getString('Network connection error');
            break;
          case 'NOT_FOUND':
            body = gettextCatalog.getString('Wallet service not found');
            break;
          case 'ECONNRESET_ERROR':
            body = gettextCatalog.getString('Connection reset by peer');
            break;
          case 'BAD_RESPONSE_CODE':
            body = gettextCatalog.getString('The request could not be understood by the server');
            break;
          case 'WALLET_ALREADY_EXISTS':
            body = gettextCatalog.getString('Wallet already exists');
            break;
          case 'COPAYER_IN_WALLET':
            body = gettextCatalog.getString('Copayer already in this wallet');
            break;
          case 'WALLET_FULL':
            body = gettextCatalog.getString('Wallet is full');
            break;
          case 'WALLET_NOT_FOUND':
            body = gettextCatalog.getString('Wallet not found');
            break;
          case 'INSUFFICIENT_FUNDS_FOR_FEE':
            body = gettextCatalog.getString('Insufficient funds for fee');
            break;
          case 'LOCKED_FUNDS':
            body = gettextCatalog.getString('Funds are locked by pending spend proposals');
            break;
          case 'COPAYER_VOTED':
            body = gettextCatalog.getString('Copayer already voted on this spend proposal');
            break;
          case 'NOT_AUTHORIZED':
            body = gettextCatalog.getString('Not authorized');
            break;
          case 'TX_ALREADY_BROADCASTED':
            body = gettextCatalog.getString('Transaction already broadcasted');
            break;
          case 'TX_CANNOT_CREATE':
            body = gettextCatalog.getString('Locktime in effect. Please wait to create a new spend proposal');
            break;
          case 'TX_CANNOT_REMOVE':
            body = gettextCatalog.getString('Locktime in effect. Please wait to remove this spend proposal');
            break;
          case 'TX_NOT_ACCEPTED':
            body = gettextCatalog.getString('Spend proposal is not accepted');
            break;
          case 'TX_NOT_FOUND':
            body = gettextCatalog.getString('Spend proposal not found');
            break;
          case 'TX_NOT_PENDING':
            body = gettextCatalog.getString('The spend proposal is not pending');
            break;
          case 'UPGRADE_NEEDED':
            body = gettextCatalog.getString('Please upgrade ColuWallet to perform this action');
            break;
          case 'BAD_SIGNATURES':
            body = gettextCatalog.getString('Signatures rejected by server');
            break;
          case 'COPAYER_DATA_MISMATCH':
            body = gettextCatalog.getString('Copayer data mismatch');
            break;
          case 'DUST_AMOUNT':
            body = gettextCatalog.getString('Amount below minimum allowed');
            break;
          case 'INCORRECT_ADDRESS_NETWORK':
            body = gettextCatalog.getString('Incorrect address network');
            break;
          case 'COPAYER_REGISTERED':
            body = gettextCatalog.getString('Key already associated with an existing wallet');
            break;
          case 'INVALID_ADDRESS':
            body = gettextCatalog.getString('Invalid address');
            break;
          case 'MAIN_ADDRESS_GAP_REACHED':
            body = gettextCatalog.getString('Empty addresses limit reached. New addresses cannot be generated.');
            break;
          case 'WALLET_LOCKED':
            body = gettextCatalog.getString('Wallet is locked');
            break;
          case 'WALLET_NOT_COMPLETE':
            body = gettextCatalog.getString('Wallet is not complete');
            break;
          case 'WALLET_NEEDS_BACKUP':
            body = gettextCatalog.getString('Wallet needs backup');
            break;
          case 'MISSING_PARAMETER':
            body = gettextCatalog.getString('Missing parameter');
            break;
          case 'NO_PASSWORD_GIVEN':
            body = gettextCatalog.getString('Spending Password needed');
            break;
          case 'PASSWORD_INCORRECT':
            body = gettextCatalog.getString('Wrong spending password');
            break;
          case 'EXCEEDED_DAILY_LIMIT':
            body = gettextCatalog.getString('Exceeded daily limit of $500 per user');
            break;
          case 'ERROR':
            body = (err.message || err.error);
            break;

          default:
            $log.warn('Unknown error type:', name);
            body = err.message || name;
            break;
        }
      } else if (err.message) {
        body = err.message;
      } else {
        body = err;
      }

      var msg = prefix + (body ? (prefix ? ': ' : '') + body : '');
      return msg;
    };

    root.cb = function(err, prefix, cb) {
      return cb(root.msg(err, prefix));
    };

    return root;
  });

'use strict';

angular.module('copayApp.services').factory('coinbaseService', function($http, $log, platformInfo, lodash, storageService, configService) {
  var root = {};
  var credentials = {};
  var isCordova = platformInfo.isCordova;

  root.setCredentials = function(network) {
    credentials.SCOPE = ''
      + 'wallet:accounts:read,'
      + 'wallet:addresses:read,'
      + 'wallet:addresses:create,'
      + 'wallet:user:read,'
      + 'wallet:user:email,'
      + 'wallet:buys:read,'
      + 'wallet:buys:create,'
      + 'wallet:sells:read,'
      + 'wallet:sells:create,'
      + 'wallet:transactions:read,'
      + 'wallet:transactions:send,'
      + 'wallet:payment-methods:read';

    if (isCordova) {
      credentials.REDIRECT_URI = 'copay://coinbase';
    } else {
      credentials.REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';
    }

    if (network == 'testnet') {
      credentials.HOST = 'https://sandbox.coinbase.com';
      credentials.API = 'https://api.sandbox.coinbase.com';
      credentials.CLIENT_ID = '6cdcc82d5d46654c46880e93ab3d2a43c639776347dd88022904bd78cd067841';
      credentials.CLIENT_SECRET = '228cb6308951f4b6f41ba010c7d7981b2721a493c40c50fd2425132dcaccce59';
    }
    else {
      credentials.HOST = 'https://coinbase.com';
      credentials.API = 'https://api.coinbase.com';
      credentials.CLIENT_ID = window.coinbase_client_id;
      credentials.CLIENT_SECRET = window.coinbase_client_secret;
    };
  };

  root.getOauthCodeUrl = function() {
    return credentials.HOST 
      + '/oauth/authorize?response_type=code&client_id=' 
      + credentials.CLIENT_ID 
      + '&redirect_uri='
      + credentials.REDIRECT_URI
      + '&state=SECURE_RANDOM&scope='
      + credentials.SCOPE
      + '&meta[send_limit_amount]=1000&meta[send_limit_currency]=USD&meta[send_limit_period]=day';
  };

  root.getToken = function(code, cb) {
    var req = {
      method: 'POST',
      url: credentials.API + '/oauth/token',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: { 
        grant_type : 'authorization_code',
        code: code,
        client_id : credentials.CLIENT_ID,
        client_secret: credentials.CLIENT_SECRET,
        redirect_uri: credentials.REDIRECT_URI
      }
    };

    $http(req).then(function(data) {
      $log.info('Coinbase Authorization Access Token: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Authorization Access Token: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.refreshToken = function(refreshToken, cb) {
    var req = {
      method: 'POST',
      url: credentials.API + '/oauth/token',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: { 
        grant_type : 'refresh_token',
        client_id : credentials.CLIENT_ID,
        client_secret: credentials.CLIENT_SECRET,
        redirect_uri: credentials.REDIRECT_URI,
        refresh_token: refreshToken 
      }
    };

    $http(req).then(function(data) {
      $log.info('Coinbase Refresh Access Token: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Refresh Access Token: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  var _get = function(endpoint, token) {
    return {
      method: 'GET',
      url: credentials.API + '/v2' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    };
  };

  root.getAccounts = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts', token)).then(function(data) {
      $log.info('Coinbase Get Accounts: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Accounts: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getAccount = function(token, accountId, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts/' + accountId, token)).then(function(data) {
      $log.info('Coinbase Get Account: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Account: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getAuthorizationInformation = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/auth', token)).then(function(data) {
      $log.info('Coinbase Autorization Information: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Autorization Information: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getCurrentUser = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user', token)).then(function(data) {
      $log.info('Coinbase Get Current User: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Current User: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getTransaction = function(token, accountId, transactionId, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts/' + accountId + '/transactions/' + transactionId, token)).then(function(data) {
      $log.info('Coinbase Transaction: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Transaction: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getTransactions = function(token, accountId, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts/' + accountId + '/transactions', token)).then(function(data) {
      $log.info('Coinbase Transactions: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Transactions: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.paginationTransactions = function(token, Url, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get(Url.replace('/v2', ''), token)).then(function(data) {
      $log.info('Coinbase Pagination Transactions: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Pagination Transactions: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.sellPrice = function(token, currency, cb) {
    $http(_get('/prices/sell?currency=' + currency, token)).then(function(data) {
      $log.info('Coinbase Sell Price: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Sell Price: ERROR ' + data.statusText);
      return cb(data.data);
    });
  }; 

  root.buyPrice = function(token, currency, cb) {
    $http(_get('/prices/buy?currency=' + currency, token)).then(function(data) {
      $log.info('Coinbase Buy Price: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Buy Price: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getPaymentMethods = function(token, cb) {
    $http(_get('/payment-methods', token)).then(function(data) {
      $log.info('Coinbase Get Payment Methods: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Get Payment Methods: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getPaymentMethod = function(token, paymentMethodId, cb) {
    $http(_get('/payment-methods/' + paymentMethodId, token)).then(function(data) {
      $log.info('Coinbase Get Payment Method: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Get Payment Method: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  var _post = function(endpoint, token, data) {
    return {
      method: 'POST',
      url: credentials.API + '/v2' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: data
    };
  }; 

  root.sellRequest = function(token, accountId, data, cb) {
    var data = {
      amount: data.amount,
      currency: data.currency,
      payment_method: data.payment_method || null,
      commit: data.commit || false
    };
    $http(_post('/accounts/' + accountId + '/sells', token, data)).then(function(data) {
      $log.info('Coinbase Sell Request: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Sell Request: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.sellCommit = function(token, accountId, sellId, cb) {
    $http(_post('/accounts/' + accountId + '/sells/' + sellId + '/commit', token)).then(function(data) {
      $log.info('Coinbase Sell Commit: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Sell Commit: ERROR ' + data.statusText);
      return cb(data.data);
    });
  }; 

  root.buyRequest = function(token, accountId, data, cb) {
    var data = {
      amount: data.amount,
      currency: data.currency,
      payment_method: data.payment_method || null,
      commit: false
    };
    $http(_post('/accounts/' + accountId + '/buys', token, data)).then(function(data) {
      $log.info('Coinbase Buy Request: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Buy Request: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.buyCommit = function(token, accountId, buyId, cb) {
    $http(_post('/accounts/' + accountId + '/buys/' + buyId + '/commit', token)).then(function(data) {
      $log.info('Coinbase Buy Commit: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Buy Commit: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.createAddress = function(token, accountId, data, cb) {
    var data = {
      name: data.name
    };
    $http(_post('/accounts/' + accountId + '/addresses', token, data)).then(function(data) {
      $log.info('Coinbase Create Address: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Create Address: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.sendTo = function(token, accountId, data, cb) {
    var data = {
      type: 'send',
      to: data.to,
      amount: data.amount,
      currency: data.currency,
      description: data.description
    };
    $http(_post('/accounts/' + accountId + '/transactions', token, data)).then(function(data) {
      $log.info('Coinbase Create Address: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Coinbase Create Address: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  // Pending transactions
  
  root.savePendingTransaction = function(ctx, opts, cb) {
    var network = configService.getSync().coinbase.testnet ? 'testnet' : 'livenet';
    storageService.getCoinbaseTxs(network, function(err, oldTxs) {
      if (lodash.isString(oldTxs)) {
        oldTxs = JSON.parse(oldTxs);
      }
      if (lodash.isString(ctx)) {
        ctx = JSON.parse(ctx);
      }
      var tx = oldTxs || {};
      tx[ctx.id] = ctx;
      if (opts && (opts.error || opts.status)) {
        tx[ctx.id] = lodash.assign(tx[ctx.id], opts);
      }
      if (opts && opts.remove) {
        delete(tx[ctx.id]);
      }
      tx = JSON.stringify(tx);

      storageService.setCoinbaseTxs(network, tx, function(err) {
        return cb(err);
      });
    });
  };

  root.getPendingTransactions = function(cb) {
    var network = configService.getSync().coinbase.testnet ? 'testnet' : 'livenet';
    storageService.getCoinbaseTxs(network, function(err, txs) {
      var _txs = txs ? JSON.parse(txs) : {};
      return cb(err, _txs);
    });
  };

  root.logout = function(network, cb) {
    storageService.removeCoinbaseToken(network, function() {
      storageService.removeCoinbaseRefreshToken(network, function() {
        return cb();
      });
    });
  };

  return root;

});

'use strict';

angular.module('copayApp.services').factory('configService', function(instanceConfig, storageService, lodash, $log) {
  var root = {};

  var defaultConfig = {
    // wallet limits
    limits: {
      totalCopayers: 6,
      mPlusN: 100,
    },

    // Bitcore wallet service URL
    bws: {
      url: 'https://bws.coloredcoins.org/v2/bws/api',
      //url: 'http://localhost:3232/bws/api',
    },

    // wallet default config
    wallet: {
      requiredCopayers: 2,
      totalCopayers: 3,
      spendUnconfirmed: true,
      reconnectDelay: 5000,
      idleDurationMin: 4,
      settings: {
        unitName: 'bits',
        unitToSatoshi: 100,
        unitDecimals: 2,
        unitCode: 'bit',
        alternativeName: 'US Dollar',
        alternativeIsoCode: 'USD',
      }
    },

    // External services
    glidera: {
      enabled: true,
      testnet: false
    },

    coinbase: {
      enabled: true,
      testnet: false
    },

    rates: {
      url: 'https://insight.bitpay.com:443/api/rates',
    },

    release: {
      url: 'https://api.github.com/repos/bitpay/copay/releases/latest'
    },

    pushNotifications: {
      enabled: true,
      config: {
        android: {
          senderID: '1036948132229',
          icon: 'push',
          iconColor: '#2F4053'
        },
        ios: {
          alert: 'true',
          badge: 'true',
          sound: 'true',
        },
        windows: {},
      }
    },
  };

  var configCache = null;


  root.getSync = function() {
    if (!configCache)
      throw new Error('configService#getSync called when cache is not initialized');

    return configCache;
  };

  root.get = function(cb) {

    storageService.getConfig(function(err, localConfig) {
      if (localConfig) {
        configCache = JSON.parse(localConfig);

        //these ifs are to avoid migration problems
        if (!configCache.bws) {
          configCache.bws = defaultConfig.bws;
        }
        if (!configCache.wallet) {
          configCache.wallet = defaultConfig.wallet;
        }
        if (!configCache.wallet.settings.unitCode) {
          configCache.wallet.settings.unitCode = defaultConfig.wallet.settings.unitCode;
        }
        if (!configCache.glidera) {
          configCache.glidera = defaultConfig.glidera;
        }
        if (!configCache.coinbase) {
          configCache.coinbase = defaultConfig.coinbase;
        }
        if (!configCache.pushNotifications) {
          configCache.pushNotifications = defaultConfig.pushNotifications;
        }
      } else {
        configCache = lodash.clone(defaultConfig);
      };

      // Glidera
      // Disabled for testnet
      configCache.glidera.testnet = false;

      // Coinbase
      // Disabled for testnet
      configCache.coinbase.testnet = false;

      $log.debug('Preferences read:', configCache)
      return cb(err, configCache);
    });
  };

  root.set = function(newOpts, cb) {
    var config = lodash.cloneDeep(defaultConfig);
    storageService.getConfig(function(err, oldOpts) {
      oldOpts = oldOpts || {};

      if (lodash.isString(oldOpts)) {
        oldOpts = JSON.parse(oldOpts);
      }
      if (lodash.isString(config)) {
        config = JSON.parse(config);
      }
      if (lodash.isString(newOpts)) {
        newOpts = JSON.parse(newOpts);
      }

      lodash.merge(config, oldOpts, newOpts);
      configCache = config;

      storageService.storeConfig(JSON.stringify(config), cb);
    });
  };

  root.reset = function(cb) {
    configCache = lodash.clone(defaultConfig);
    storageService.removeConfig(cb);
  };

  root.getDefaults = function() {
    return lodash.clone(defaultConfig);
  };


  return root;
});


'use strict';

angular.module('copayApp.services').factory('confirmDialog', function($log, $timeout, profileService, configService, gettextCatalog, platformInfo) {
  var root = {};


  var acceptMsg = gettextCatalog.getString('Accept');
  var cancelMsg = gettextCatalog.getString('Cancel');
  var confirmMsg = gettextCatalog.getString('Confirm');

  root.show = function(msg, cb) {
    if (platformInfo.isCordova) { 
      navigator.notification.confirm(
        msg,
        function(buttonIndex) {
          if (buttonIndex == 1) {
            $timeout(function() {
              return cb(true);
            }, 1);
          } else {
            return cb(false);
          }
        },
        confirmMsg, [acceptMsg, cancelMsg]
      );
    } else if (platformInfo.isChromeApp) {
      // No feedback, alert/confirm not supported.
      return cb(true);
    } else {
      return cb(confirm(msg));
    }
  };

  return root;
});


'use strict';

angular.module('copayApp.services').factory('derivationPathHelper', function(lodash) {
  var root = {};

  root.default = "m/44'/0'/0'";
  root.defaultTestnet = "m/44'/1'/0'";

  root.parse = function(str) {
    var arr = str.split('/');

    var ret = {};

    if (arr[0] != 'm')
      return false;

    switch (arr[1]) {
      case "44'":
        ret.derivationStrategy = 'BIP44';
        break;
      case "45'":
        return {
          derivationStrategy: 'BIP45',
          networkName: 'livenet',
          account: 0,
        }
        break;
      case "48'":
        ret.derivationStrategy = 'BIP48';
        break;
      default:
        return false;
    };

    switch (arr[2]) {
      case "0'":
        ret.networkName = 'livenet';
        break;
      case "1'":
        ret.networkName = 'testnet';
        break;
      default:
        return false;
    };

    var match = arr[3].match(/(\d+)'/);
    if (!match)
      return false;
    ret.account = +match[1]

    return ret;
  };

  return root;
});

'use strict';

angular.module('copayApp.services').factory('feeService', function($log, bwcService, profileService, configService, gettext, lodash) {
  var root = {};

  // Constant fee options to translate
  root.feeOpts = {
    priority: gettext('Priority'),
    normal: gettext('Normal'),
    economy: gettext('Economy'),
    superEconomy: gettext('Super Economy')
  };

  root.getCurrentFeeLevel = function() {
    return configService.getSync().wallet.settings.feeLevel || 'normal';
  };

  root.getCurrentFeeValue = function(cb) {
    var fc = profileService.focusedClient;
    var feeLevel = root.getCurrentFeeLevel();

    fc.getFeeLevels(fc.credentials.network, function(err, levels) {
      if (err)
        return cb({
          message: 'Could not get dynamic fee'
        });

      var feeLevelValue = lodash.find(levels, {
        level: feeLevel
      });
      if (!feeLevelValue || !feeLevelValue.feePerKB)
        return cb({
          message: 'Could not get dynamic fee for level: ' + feeLevel
        });

      var fee = feeLevelValue.feePerKB;
      $log.debug('Dynamic fee: ' + feeLevel + ' ' + fee + ' SAT');
      return cb(null, fee);
    });
  };

  root.getFeeLevels = function(cb) {
    var walletClient = bwcService.getClient();

    var unitName = configService.getSync().wallet.settings.unitName;

    walletClient.getFeeLevels('livenet', function(errLivenet, levelsLivenet) {
      walletClient.getFeeLevels('testnet', function(errTestnet, levelsTestnet) {
        if (errLivenet || errTestnet) $log.debug('Could not get dynamic fee');
        else {
          for (var i = 0; i < 4; i++) {
            levelsLivenet[i]['feePerKBUnit'] = profileService.formatAmount(levelsLivenet[i].feePerKB) + ' ' + unitName;
            levelsTestnet[i]['feePerKBUnit'] = profileService.formatAmount(levelsTestnet[i].feePerKB) + ' ' + unitName;
          }
        }

        return cb({
          'livenet': levelsLivenet,
          'testnet': levelsTestnet
        });
      });
    });
  };

  return root;
});

'use strict';

angular.module('copayApp.services')
  .factory('fileStorageService', function(lodash, $log) {
    var root = {},
      _fs, _dir;

    root.init = function(cb) {
      if (_dir) return cb(null, _fs, _dir);

      function onFileSystemSuccess(fileSystem) {
        console.log('File system started: ', fileSystem.name, fileSystem.root.name);
        _fs = fileSystem;
        root.getDir(function(err, newDir) {
          if (err || !newDir.nativeURL) return cb(err);
          _dir = newDir
          $log.debug("Got main dir:", _dir.nativeURL);
          return cb(null, _fs, _dir);
        });
      }

      function fail(evt) {
        var msg = 'Could not init file system: ' + evt.target.error.code;
        console.log(msg);
        return cb(msg);
      };

      window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemSuccess, fail);
    };

    root.get = function(k, cb) {
      root.init(function(err, fs, dir) {
        if (err) return cb(err);
        dir.getFile(k, {
          create: false,
        }, function(fileEntry) {
          if (!fileEntry) return cb();
          fileEntry.file(function(file) {
            var reader = new FileReader();

            reader.onloadend = function(e) {
              return cb(null, this.result)
            }

            reader.readAsText(file);
          });
        }, function(err) {
          // Not found
          if (err.code == 1) return cb();
          else return cb(err);
        });
      })
    };

    var writelock = {};

    root.set = function(k, v, cb, delay) {

      delay = delay || 100;

      if (writelock[k]) {
        return setTimeout(function() {
          console.log('## Writelock for:' + k + ' Retrying in ' + delay);
          return root.set(k, v, cb, delay + 100);
        }, delay);
      }

      writelock[k] = true;
      root.init(function(err, fs, dir) {
        if (err) {
          writelock[k] = false;
          return cb(err);
        }
        dir.getFile(k, {
          create: true,
        }, function(fileEntry) {
          // Create a FileWriter object for our FileEntry (log.txt).
          fileEntry.createWriter(function(fileWriter) {

            fileWriter.onwriteend = function(e) {
              console.log('Write completed:' + k);
              writelock[k] = false;
              return cb();
            };

            fileWriter.onerror = function(e) {
              var err = e.error ? e.error : JSON.stringify(e);
              console.log('Write failed: ' + err);
              writelock[k] = false;
              return cb('Fail to write:' + err);
            };

            if (lodash.isObject(v))
              v = JSON.stringify(v);

            if (!lodash.isString(v)) {
              v = v.toString();
            }

            $log.debug('Writing:', k, v);
            fileWriter.write(v);

          }, cb);
        });
      });
    };


    // See https://github.com/apache/cordova-plugin-file/#where-to-store-files
    root.getDir = function(cb) {
      if (!cordova.file) {
        return cb('Could not write on device storage');
      }

      var url = cordova.file.dataDirectory;
      // This could be needed for windows
      // if (cordova.file === undefined) {
      //   url = 'ms-appdata:///local/';
      window.resolveLocalFileSystemURL(url, function(dir) {
        return cb(null, dir);
      }, function(err) {
        $log.warn(err);
        return cb(err || 'Could not resolve filesystem:' + url);
      });
    };

    root.remove = function(k, cb) {
      root.init(function(err, fs, dir) {
        if (err) return cb(err);
        dir.getFile(k, {
          create: false,
        }, function(fileEntry) {
          // Create a FileWriter object for our FileEntry (log.txt).
          fileEntry.remove(function() {
            console.log('File removed.');
            return cb();
          }, cb);
        }, cb);
      });
    };

    /**
     * Same as setItem, but fails if an item already exists
     */
    root.create = function(name, value, callback) {
      root.get(name,
        function(err, data) {
          if (data) {
            return callback('EEXISTS');
          } else {
            return root.set(name, value, callback);
          }
        });
    };

    return root;
  });

'use strict';

angular.module('copayApp.services').factory('fingerprintService', function($log, gettextCatalog, configService, platformInfo) {
  var root = {};

  var _isAvailable = false;

  if (platformInfo.isCordova && !platformInfo.isWP) {
    window.plugins.touchid = window.plugins.touchid || {};
    window.plugins.touchid.isAvailable(
      function(msg) {
        _isAvailable = 'IOS';
      },
      function(msg) {
        FingerprintAuth.isAvailable(function(result) {

          if (result.isAvailable) 
            _isAvailable = 'ANDROID';

        }, function() {
          _isAvailable = false;
        });
      });
  };

  var requestFinger = function(cb) {
    try {
      FingerprintAuth.show({
          clientId: 'Copay',
          clientSecret: 'hVu1NvCZOyUuGgr46bFL',
        },
        function(result) {
          if (result.withFingerprint) {
            $log.debug('Finger OK');
            return cb();
          } else if (result.withPassword) {
            $log.debug("Finger: Authenticated with backup password");
            return cb();
          }
        },
        function(msg) {
          $log.debug('Finger Failed:' + JSON.stringify(msg));
          return cb(gettextCatalog.getString('Finger Scan Failed') + ': ' + msg.localizedDescription);
        }
      );
    } catch (e) {
      $log.warn('Finger Scan Failed:' + JSON.stringify(e));
      return cb(gettextCatalog.getString('Finger Scan Failed'));
    };
  };


  var requestTouchId = function(cb) {
    try {
      window.plugins.touchid.verifyFingerprint(
        gettextCatalog.getString('Scan your fingerprint please'),
        function(msg) {
          $log.debug('Touch ID OK');
          return cb();
        },
        function(msg) {
          $log.debug('Touch ID Failed:' + JSON.stringify(msg));
          return cb(gettextCatalog.getString('Touch ID Failed') + ': ' + msg.localizedDescription);
        }
      );
    } catch (e) {
      $log.debug('Touch ID Failed:' + JSON.stringify(e));
      return cb(gettextCatalog.getString('Touch ID Failed'));
    };
  };

  var isNeeded = function(client) {
    if (!_isAvailable) return false;

    var config = configService.getSync();
    config.touchIdFor = config.touchIdFor || {};

    return config.touchIdFor[client.credentials.walletId];
  };

  root.isAvailable = function(client) {
    return _isAvailable;
  };

  root.check = function(client, cb) {
    if (isNeeded(client)) {
      $log.debug('FingerPrint Service:', _isAvailable); 
      if (_isAvailable == 'IOS')
        return requestTouchId(cb);
      else
        return requestFinger(cb);
    } else {
      return cb();
    }
  };

  return root;
});

'use strict';

angular.module('copayApp.services').factory('glideraService', function($http, $log, platformInfo) {
  var root = {};
  var credentials = {};
  var isCordova = platformInfo.isCordova;

  root.setCredentials = function(network) {
    if (network == 'testnet') {
      credentials.HOST = 'https://sandbox.glidera.io';
      if (isCordova) {
        credentials.REDIRECT_URI = 'copay://glidera';
        credentials.CLIENT_ID = '6163427a2f37d1b2022ececd6d6c9cdd';
        credentials.CLIENT_SECRET = '599cc3af26108c6fece8ab17c3f35867';
      }
      else {
        credentials.REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';
        credentials.CLIENT_ID = 'c402f4a753755456e8c384fb65b7be1d';
        credentials.CLIENT_SECRET = '3ce826198e3618d0b8ed341ab91fe4e5';
      }
    }
    else {
      credentials.HOST = 'https://glidera.io';
      if (isCordova) {
        credentials.REDIRECT_URI = 'copay://glidera';
        credentials.CLIENT_ID = '9c8023f0ac0128235b7b27a6f2610c83';
        credentials.CLIENT_SECRET = '30431511407b47f25a83bffd72881d55';
      }
      else {
        credentials.REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';
        credentials.CLIENT_ID = '8a9e8a9cf155db430c1ea6c7889afed1';
        credentials.CLIENT_SECRET = '24ddec578f38d5488bfe13601933c05f';
      }
    };
  };

  root.getOauthCodeUrl = function() {
    return credentials.HOST 
      + '/oauth2/auth?response_type=code&client_id=' 
      + credentials.CLIENT_ID 
      + '&redirect_uri='
      + credentials.REDIRECT_URI;
  };

  root.getToken = function(code, cb) {
    var req = {
      method: 'POST',
      url: credentials.HOST + '/api/v1/oauth/token',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: { 
        grant_type : 'authorization_code',
        code: code,
        client_id : credentials.CLIENT_ID,
        client_secret: credentials.CLIENT_SECRET,
        redirect_uri: credentials.REDIRECT_URI
      }
    };

    $http(req).then(function(data) {
      $log.info('Glidera Authorization Access Token: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Glidera Authorization Access Token: ERROR ' + data.statusText);
      return cb('Glidera Authorization Access Token: ERROR ' + data.statusText);
    });
  };

  var _get = function(endpoint, token) {
    return {
      method: 'GET',
      url: credentials.HOST + '/api/v1' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    };
  };

  root.getAccessTokenPermissions = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/oauth/token', token)).then(function(data) {
      $log.info('Glidera Access Token Permissions: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Access Token Permissions: ERROR ' + data.statusText);
      return cb('Glidera Access Token Permissions: ERROR ' + data.statusText);
    });
  };

  root.getEmail = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/email', token)).then(function(data) {
      $log.info('Glidera Get Email: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Get Email: ERROR ' + data.statusText);
      return cb('Glidera Get Email: ERROR ' + data.statusText);
    });
  };

  root.getPersonalInfo = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/personalinfo', token)).then(function(data) {
      $log.info('Glidera Get Personal Info: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Get Personal Info: ERROR ' + data.statusText);
      return cb('Glidera Get Personal Info: ERROR ' + data.statusText);
    });
  };

  root.getStatus = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/status', token)).then(function(data) {
      $log.info('Glidera User Status: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera User Status: ERROR ' + data.statusText);
      return cb('Glidera User Status: ERROR ' + data.statusText);
    });
  };

  root.getLimits = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/limits', token)).then(function(data) {
      $log.info('Glidera Transaction Limits: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Transaction Limits: ERROR ' + data.statusText);
      return cb('Glidera Transaction Limits: ERROR ' + data.statusText);
    });
  };

  root.getTransactions = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/transaction', token)).then(function(data) {
      $log.info('Glidera Transactions: SUCCESS');
      return cb(null, data.data.transactions);
    }, function(data) {
      $log.error('Glidera Transactions: ERROR ' + data.statusText);
      return cb('Glidera Transactions: ERROR ' + data.statusText);
    });
  };

  root.getTransaction = function(token, txid, cb) {
    if (!token) return cb('Invalid Token');
    if (!txid) return cb('TxId required');
    $http(_get('/transaction/' + txid, token)).then(function(data) {
      $log.info('Glidera Transaction: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Transaction: ERROR ' + data.statusText);
      return cb('Glidera Transaction: ERROR ' + data.statusText);
    });
  };

  root.getSellAddress = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/create_sell_address', token)).then(function(data) {
      $log.info('Glidera Create Sell Address: SUCCESS');
      return cb(null, data.data.sellAddress);
    }, function(data) {
      $log.error('Glidera Create Sell Address: ERROR ' + data.statusText);
      return cb('Glidera Create Sell Address: ERROR ' + data.statusText);
    });
  };

  root.get2faCode = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/authentication/get2faCode', token)).then(function(data) {
      $log.info('Glidera Sent 2FA code by SMS: SUCCESS');
      return cb(null, data.status == 200 ? true : false);
    }, function(data) {
      $log.error('Glidera Sent 2FA code by SMS: ERROR ' + data.statusText);
      return cb('Glidera Sent 2FA code by SMS: ERROR ' + data.statusText);
    });
  };

  var _post = function(endpoint, token, twoFaCode, data) {
    return {
      method: 'POST',
      url: credentials.HOST + '/api/v1' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token,
        '2FA_CODE': twoFaCode
      },
      data: data
    };
  };

  root.sellPrice = function(token, price, cb) {
    var data = {
      qty: price.qty,
      fiat: price.fiat
    };
    $http(_post('/prices/sell', token, null, data)).then(function(data) {
      $log.info('Glidera Sell Price: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Glidera Sell Price: ERROR ' + data.statusText);
      return cb('Glidera Sell Price: ERROR ' + data.statusText);
    });
  }; 

  root.sell = function(token, twoFaCode, data, cb) {
    var data = {
      refundAddress: data.refundAddress,
      signedTransaction: data.signedTransaction,
      priceUuid: data.priceUuid,
      useCurrentPrice: data.useCurrentPrice,
      ip: data.ip
    };
    $http(_post('/sell', token, twoFaCode, data)).then(function(data) {
      $log.info('Glidera Sell: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Glidera Sell Request: ERROR ' + data.statusText);
      return cb('Glidera Sell Request: ERROR ' + data.statusText);
    });
  };

  root.buyPrice = function(token, price, cb) {
    var data = {
      qty: price.qty,
      fiat: price.fiat
    };
    $http(_post('/prices/buy', token, null, data)).then(function(data) {
      $log.info('Glidera Buy Price: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Glidera Buy Price: ERROR ' + data.statusText);
      return cb('Glidera Buy Price: ERROR ' + data.statusText);
    });
  };

  root.buy = function(token, twoFaCode, data, cb) {
    var data = {
      destinationAddress: data.destinationAddress,
      qty: data.qty,
      priceUuid: data.priceUuid,
      useCurrentPrice: data.useCurrentPrice,
      ip: data.ip
    };
    $http(_post('/buy', token, twoFaCode, data)).then(function(data) {
      $log.info('Glidera Buy: SUCCESS');
      return cb(null, data.data); 
    }, function(data) {
      $log.error('Glidera Buy Request: ERROR ' + data.statusText);
      return cb('Glidera Buy Request: ERROR ' + data.statusText);
    });
  };

  return root;

});

'use strict';

angular.module('copayApp.services').factory('go', function($window, $ionicSideMenuDelegate, $rootScope, $location, $state, $timeout, $log, profileService, platformInfo, nodeWebkit) {
  var root = {};

  root.openExternalLink = function(url, target) {
    if (platformInfo.isNW) {
      nodeWebkit.openExternalLink(url);
    } else {
      target = target || '_blank';
      var ref = window.open(url, target, 'location=no');
    }
  };

  root.is = function(name) {
    return $state.is(name);
  };

  root.path = function(path, cb) {
    $state.transitionTo(path)
      .then(function() {
        if (cb) return cb();
      }, function() {
        if (cb) return cb('animation in progress');
      });
  };

  root.toggleLeftMenu = function() {
    $ionicSideMenuDelegate.toggleLeft();
  };

  root.walletHome = function() {
    var fc = profileService.focusedClient;
    if (fc && !fc.isComplete()) {
      $log.debug("Wallet not complete at startup... redirecting")
      root.path('copayers');
    } else {
      root.path('walletHome', function() {
        $rootScope.$emit('Local/SetTab', 'walletHome', true);
      });
    }
  };

  root.send = function() {
    root.path('walletHome', function() {
      $rootScope.$emit('Local/SetTab', 'send');
    });
  };

  root.addWallet = function() {
    $state.transitionTo('add');
  };

  root.preferences = function() {
    $state.transitionTo('preferences');
  };

  root.preferencesGlobal = function() {
    $state.transitionTo('preferencesGlobal');
  };

  root.reload = function() {
    $state.reload();
  };


  // Global go. This should be in a better place TODO
  // We don't do a 'go' directive, to use the benefits of ng-touch with ng-click
  $rootScope.go = function(path) {
    root.path(path);
  };

  $rootScope.openExternalLink = function(url, target) {
    root.openExternalLink(url, target);
  };



  return root;
});

'use strict';
var logs = [];
angular.module('copayApp.services')
  .factory('historicLog', function historicLog() {
    var root = {};

    root.add = function(level, msg) {
      logs.push({
        level: level,
        msg: msg,
      });
    };

    root.get = function() {
      return logs;
    };

    return root;
  });

'use strict';

angular.module('copayApp.services')
  .factory('hwWallet', function($log,  bwcService) {
    var root = {};

    // Ledger magic number to get xPub without user confirmation
    root.ENTROPY_INDEX_PATH = "0xb11e/";
    root.UNISIG_ROOTPATH = 44;
    root.MULTISIG_ROOTPATH = 48;
    root.LIVENET_PATH = 0;

    root._err = function(data) {
      var msg = 'Hardware Wallet Error: ' + (data.error || data.message || 'unknown');
      $log.warn(msg);
      return msg;
    };


    root.getRootPath = function(device, isMultisig, account) {
      if (!isMultisig) return root.UNISIG_ROOTPATH;

      // Compat
      if (device == 'ledger' && account ==0) return root.UNISIG_ROOTPATH;

      return root.MULTISIG_ROOTPATH;
    };

    root.getAddressPath = function(device, isMultisig, account) {
      return root.getRootPath(device,isMultisig,account) + "'/" + root.LIVENET_PATH + "'/" + account + "'";
    }

    root.getEntropyPath = function(device, isMultisig, account) {
      var path;

      // Old ledger wallet compat
      if (device == 'ledger' && account == 0)
        return root.ENTROPY_INDEX_PATH  + "0'";

      return root.ENTROPY_INDEX_PATH + root.getRootPath(device,isMultisig,account) + "'/" + account + "'";
    };

    root.pubKeyToEntropySource = function(xPubKey) {
      var b = bwcService.getBitcore();
      var x = b.HDPublicKey(xPubKey);
      return x.publicKey.toString();
    };

    return root;
  });

'use strict';

angular.module('copayApp.services').provider('instanceConfig', function() {
  var provider = {};

  if (window.unicoisaConfig) {
    provider.config = window.unicoisaConfig;
  } else {
    console.error('No wallet config found');
    provider.config = {
      walletName: 'Wallet not found'
    };
  }

  provider.$get = function() {
    return provider.config;
  }

  return provider;
});

'use strict';
angular.module('copayApp.services')
  .factory('latestReleaseService', function latestReleaseServiceFactory($log, $http, configService) {

    var root = {};

    root.checkLatestRelease = function(cb) {
      var releaseURL = configService.getDefaults().release.url;

      requestLatestRelease(releaseURL, function(err, release) {
        if (err) return cb(err);
        var currentVersion = window.version;
        var latestVersion = release.data.tag_name;

        if (!verifyTagFormat(currentVersion))
          return cb('Cannot verify the format of version tag: ' + currentVersion);
        if (!verifyTagFormat(latestVersion))
          return cb('Cannot verify the format of latest release tag: ' + latestVersion);

        var current = formatTagNumber(currentVersion);
        var latest = formatTagNumber(latestVersion);

        if (latest.major < current.major || (latest.major == current.major && latest.minor <= current.minor))
          return cb(null, false);

        $log.debug('A new version of ColuWallet is available: ' + latestVersion);
        return cb(null, true);
      });

      function verifyTagFormat(tag) {
        var regex = /^v?\d+\.\d+\.\d+$/i;
        return regex.exec(tag);
      };

      function formatTagNumber(tag) {
        var formattedNumber = tag.replace(/^v/i, '').split('.');
        return {
          major: +formattedNumber[0],
          minor: +formattedNumber[1],
          patch: +formattedNumber[2]
        };
      };
    };

    function requestLatestRelease(releaseURL, cb) {
      $log.debug('Retrieving latest relsease information...');

      var request = {
        url: releaseURL,
        method: 'GET',
        json: true
      };

      $http(request).then(function(release) {
        $log.debug('Latest release: ' + release.data.name);
        return cb(null, release);
      }, function(err) {
        return cb('Cannot get the release information: ' + err);
      });
    };

    return root;
  });

'use strict';

angular.module('copayApp.services')
  .factory('ledger', function($log, bwcService, gettext, hwWallet) {
    var root = {};
    var LEDGER_CHROME_ID = "kkdpmhnladdopljabkgpacgpliggeeaf";

    root.callbacks = {};
    root.hasSession = function() {
      root._message({
        command: "has_session"
      });
    }

    root.getEntropySource = function(isMultisig, account, callback) {
      root.getXPubKey(hwWallet.getEntropyPath('ledger', isMultisig, account), function(data) {
        if (!data.success)
          return callback(hwWallet._err(data));

        return callback(null,  hwWallet.pubKeyToEntropySource(data.xpubkey));
      });
    };

    root.getXPubKey = function(path, callback) {
      $log.debug('Ledger deriving xPub path:', path);
      root.callbacks["get_xpubkey"] = callback;
      root._messageAfterSession({
        command: "get_xpubkey",
        path: path
      })
    };


    root.getInfoForNewWallet = function(isMultisig, account, callback) {
      var opts = {};
      root.getEntropySource(isMultisig, account, function(err, entropySource) {
        if (err) return callback(err);

        opts.entropySource = entropySource;
        root.getXPubKey(hwWallet.getAddressPath('ledger', isMultisig, account), function(data) {
          if (!data.success) {
            $log.warn(data.message);
            return callback(data);
          }
          opts.extendedPublicKey = data.xpubkey;
          opts.externalSource = 'ledger';
          opts.account = account;

          // Old ledger compat
          opts.derivationStrategy = account ? 'BIP48' : 'BIP44';
          return callback(null, opts);
        });
      });
    };

    root._signP2SH = function(txp, account, isMultisig, callback) {
      root.callbacks["sign_p2sh"] = callback;
      var redeemScripts = [];
      var paths = [];
      var tx = bwcService.getUtils().buildTx(txp);
      for (var i = 0; i < tx.inputs.length; i++) {
        redeemScripts.push(new ByteString(tx.inputs[i].redeemScript.toBuffer().toString('hex'), GP.HEX).toString());
        paths.push(hwWallet.getAddressPath('ledger', isMultisig, account) + txp.inputs[i].path.substring(1));
      }
      var splitTransaction = root._splitTransaction(new ByteString(tx.toString(), GP.HEX));
      var inputs = [];
      for (var i = 0; i < splitTransaction.inputs.length; i++) {
        var input = splitTransaction.inputs[i];
        inputs.push([
          root._reverseBytestring(input.prevout.bytes(0, 32)).toString(),
          root._reverseBytestring(input.prevout.bytes(32)).toString()
        ]);
      }
      $log.debug('Ledger signing  paths:', paths);
      root._messageAfterSession({
        command: "sign_p2sh",
        inputs: inputs,
        scripts: redeemScripts,
        outputs_number: splitTransaction.outputs.length,
        outputs_script: splitTransaction.outputScript.toString(),
        paths: paths
      });
    };

    root.signTx = function(txp, account, callback) {

      // TODO Compat
      var isMultisig = true;
      if (txp.addressType == 'P2PKH') {
        var msg = 'P2PKH wallets are not supported with ledger';
        $log.error(msg);
        return callback(msg);
      } else {
        root._signP2SH(txp, account, isMultisig, callback);
      }
    }

    root._message = function(data) {
      chrome.runtime.sendMessage(
        LEDGER_CHROME_ID, {
          request: data
        },
        function(response) {
          root._callback(response);
        }
      );
    }

    root._messageAfterSession = function(data) {
      root._after_session = data;
      root._message({
        command: "launch"
      });
      root._should_poll_session = true;
      root._do_poll_session();
    }

    root._do_poll_session = function() {
      root.hasSession();
      if (root._should_poll_session) {
        setTimeout(root._do_poll_session, 500);
      }
    }

    root._callback = function(data) {
      if (typeof data == "object") {
        if (data.command == "has_session" && data.success) {
          root._message(root._after_session);
          root._after_session = null;
          root._should_poll_session = false;
        } else if (typeof root.callbacks[data.command] == "function") {
          root.callbacks[data.command](data);
        }
      } else {
        root._should_poll_session = false;
        Object.keys(root.callbacks).forEach(function(key) {
          root.callbacks[key]({
            success: false,
            message: gettext("The Ledger Chrome application is not installed"),
          });
        });
      }
    }

    root._splitTransaction = function(transaction) {
      var result = {};
      var inputs = [];
      var outputs = [];
      var offset = 0;
      var version = transaction.bytes(offset, 4);
      offset += 4;
      var varint = root._getVarint(transaction, offset);
      var numberInputs = varint[0];
      offset += varint[1];
      for (var i = 0; i < numberInputs; i++) {
        var input = {};
        input['prevout'] = transaction.bytes(offset, 36);
        offset += 36;
        varint = root._getVarint(transaction, offset);
        offset += varint[1];
        input['script'] = transaction.bytes(offset, varint[0]);
        offset += varint[0];
        input['sequence'] = transaction.bytes(offset, 4);
        offset += 4;
        inputs.push(input);
      }
      varint = root._getVarint(transaction, offset);
      var numberOutputs = varint[0];
      offset += varint[1];
      var outputStartOffset = offset;
      for (var i = 0; i < numberOutputs; i++) {
        var output = {};
        output['amount'] = transaction.bytes(offset, 8);
        offset += 8;
        varint = root._getVarint(transaction, offset);
        offset += varint[1];
        output['script'] = transaction.bytes(offset, varint[0]);
        offset += varint[0];
        outputs.push(output);
      }
      var locktime = transaction.bytes(offset, 4);
      result['version'] = version;
      result['inputs'] = inputs;
      result['outputs'] = outputs;
      result['locktime'] = locktime;
      result['outputScript'] = transaction.bytes(outputStartOffset, offset - outputStartOffset);
      return result;
    }

    root._getVarint = function(data, offset) {
      if (data.byteAt(offset) < 0xfd) {
        return [data.byteAt(offset), 1];
      }
      if (data.byteAt(offset) == 0xfd) {
        return [((data.byteAt(offset + 2) << 8) + data.byteAt(offset + 1)), 3];
      }
      if (data.byteAt(offset) == 0xfe) {
        return [((data.byteAt(offset + 4) << 24) + (data.byteAt(offset + 3) << 16) +
          (data.byteAt(offset + 2) << 8) + data.byteAt(offset + 1)), 5];
      }
    }

    root._reverseBytestring = function(x) {
      var res = "";
      for (var i = x.length - 1; i >= 0; i--) {
        res += Convert.toHexByte(x.byteAt(i));
      }
      return new ByteString(res, GP.HEX);
    }

    return root;
  });

var Convert = {};

/**
 * Convert a binary string to his hexadecimal representation
 * @param {String} src binary string
 * @static
 * @returns {String} hexadecimal representation
 */
Convert.stringToHex = function(src) {
  var r = "";
  var hexes = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f");
  for (var i = 0; i < src.length; i++) {
    r += hexes[src.charCodeAt(i) >> 4] + hexes[src.charCodeAt(i) & 0xf];
  }
  return r;
}

/**
 * Convert an hexadecimal string to its binary representation
 * @param {String} src hexadecimal string
 * @static
 * @return {Array} byte array
 * @throws {InvalidString} if the string isn't properly formatted
 */
Convert.hexToBin = function(src) {
  var result = "";
  var digits = "0123456789ABCDEF";
  if ((src.length % 2) != 0) {
    throw "Invalid string";
  }
  src = src.toUpperCase();
  for (var i = 0; i < src.length; i += 2) {
    var x1 = digits.indexOf(src.charAt(i));
    if (x1 < 0) {
      return "";
    }
    var x2 = digits.indexOf(src.charAt(i + 1));
    if (x2 < 0) {
      return "";
    }
    result += String.fromCharCode((x1 << 4) + x2);
  }
  return result;
}

/**
 * Convert a double digit hexadecimal number to an integer
 * @static
 * @param {String} data buffer containing the digit to parse
 * @param {Number} offset offset to the digit (default is 0)
 * @returns {Number} converted digit
 */
Convert.readHexDigit = function(data, offset) {
  var digits = '0123456789ABCDEF';
  if (typeof offset == "undefined") {
    offset = 0;
  }
  return (digits.indexOf(data.substring(offset, offset + 1).toUpperCase()) << 4) + (digits.indexOf(data.substring(offset + 1, offset + 2).toUpperCase()));
}

/**
 * Convert a number to a two digits hexadecimal string (deprecated)
 * @static
 * @param {Number} number number to convert
 * @returns {String} converted number
 */
Convert.toHexDigit = function(number) {
  var digits = '0123456789abcdef';
  return digits.charAt(number >> 4) + digits.charAt(number & 0x0F);
}

/**
 * Convert a number to a two digits hexadecimal string (similar to toHexDigit)
 * @static
 * @param {Number} number number to convert
 * @returns {String} converted number
 */
Convert.toHexByte = function(number) {
  return Convert.toHexDigit(number);
}

/**
 * Convert a BCD number to a two digits hexadecimal string
 * @static
 * @param {Number} number number to convert
 * @returns {String} converted number
 */
Convert.toHexByteBCD = function(numberBCD) {
  var number = ((numberBCD / 10) * 16) + (numberBCD % 10);
  return Convert.toHexDigit(number);
}


/**
 * Convert a number to an hexadecimal short number
 * @static
 * @param {Number} number number to convert
 * @returns {String} converted number
 */
Convert.toHexShort = function(number) {
  return Convert.toHexDigit((number >> 8) & 0xff) + Convert.toHexDigit(number & 0xff);
}

/**
 * Convert a number to an hexadecimal int number
 * @static
 * @param {Number} number number to convert
 * @returns {String} converted number
 */
Convert.toHexInt = function(number) {
  return Convert.toHexDigit((number >> 24) & 0xff) + Convert.toHexDigit((number >> 16) & 0xff) +
    Convert.toHexDigit((number >> 8) & 0xff) + Convert.toHexDigit(number & 0xff);
}


var GP = {};
GP.ASCII = 1;
GP.HEX = 5;

/**
 * @class GPScript ByteString implementation
 * @param {String} value initial value
 * @param {HEX|ASCII} encoding encoding to use
 * @property {Number} length length of the ByteString
 * @constructs
 */
var ByteString = function(value, encoding) {
  this.encoding = encoding;
  this.hasBuffer = (typeof Buffer != 'undefined');
  if (this.hasBuffer && (value instanceof Buffer)) {
    this.value = value;
    this.encoding = GP.HEX;
  } else {
    switch (encoding) {
      case GP.HEX:
        if (!this.hasBuffer) {
          this.value = Convert.hexToBin(value);
        } else {
          this.value = new Buffer(value, 'hex');
        }
        break;

      case GP.ASCII:
        if (!this.hasBuffer) {
          this.value = value;
        } else {
          this.value = new Buffer(value, 'ascii');
        }
        break;

      default:
        throw "Invalid arguments";
    }
  }
  this.length = this.value.length;
}

/**
 * Retrieve the byte value at the given index
 * @param {Number} index index
 * @returns {Number} byte value
 */
ByteString.prototype.byteAt = function(index) {
  if (arguments.length < 1) {
    throw "Argument missing";
  }
  if (typeof index != "number") {
    throw "Invalid index";
  }
  if ((index < 0) || (index >= this.value.length)) {
    throw "Invalid index offset";
  }
  if (!this.hasBuffer) {
    return Convert.readHexDigit(Convert.stringToHex(this.value.substring(index, index + 1)));
  } else {
    return this.value[index];
  }
}

/**
 * Retrieve a subset of the ByteString
 * @param {Number} offset offset to start at
 * @param {Number} [count] size of the target ByteString (default : use the remaining length)
 * @returns {ByteString} subset of the original ByteString
 */
ByteString.prototype.bytes = function(offset, count) {
  var result;
  if (arguments.length < 1) {
    throw "Argument missing";
  }
  if (typeof offset != "number") {
    throw "Invalid offset";
  }
  //if ((offset < 0) || (offset >= this.value.length)) {
  if (offset < 0) {
    throw "Invalid offset";
  }
  if (typeof count == "number") {
    if (count < 0) {
      throw "Invalid count";
    }
    if (!this.hasBuffer) {
      result = new ByteString(this.value.substring(offset, offset + count), GP.ASCII);
    } else {
      result = new Buffer(count);
      this.value.copy(result, 0, offset, offset + count);
    }
  } else
  if (typeof count == "undefined") {
    if (!this.hasBuffer) {
      result = new ByteString(this.value.substring(offset), GP.ASCII);
    } else {
      result = new Buffer(this.value.length - offset);
      this.value.copy(result, 0, offset, this.value.length);
    }
  } else {
    throw "Invalid count";
  }
  if (!this.hasBuffer) {
    result.encoding = this.encoding;
    return result;
  } else {
    return new ByteString(result, GP.HEX);
  }
}

/**
 * Appends two ByteString
 * @param {ByteString} target ByteString to append
 * @returns {ByteString} result of the concatenation
 */
ByteString.prototype.concat = function(target) {
  if (arguments.length < 1) {
    throw "Not enough arguments";
  }
  if (!(target instanceof ByteString)) {
    throw "Invalid argument";
  }
  if (!this.hasBuffer) {
    var result = this.value + target.value;
    var x = new ByteString(result, GP.ASCII);
    x.encoding = this.encoding;
    return x;
  } else {
    var result = Buffer.concat([this.value, target.value]);
    return new ByteString(result, GP.HEX);
  }
}

/**
 * Check if two ByteString are equal
 * @param {ByteString} target ByteString to check against
 * @returns {Boolean} true if the two ByteString are equal
 */
ByteString.prototype.equals = function(target) {
  if (arguments.length < 1) {
    throw "Not enough arguments";
  }
  if (!(target instanceof ByteString)) {
    throw "Invalid argument";
  }
  if (!this.hasBuffer) {
    return (this.value == target.value);
  } else {
    return Buffer.equals(this.value, target.value);
  }
}


/**
 * Convert the ByteString to a String using the given encoding
 * @param {HEX|ASCII|UTF8|BASE64|CN} encoding encoding to use
 * @return {String} converted content
 */
ByteString.prototype.toString = function(encoding) {
  var targetEncoding = this.encoding;
  if (arguments.length >= 1) {
    if (typeof encoding != "number") {
      throw "Invalid encoding";
    }
    switch (encoding) {
      case GP.HEX:
      case GP.ASCII:
        targetEncoding = encoding;
        break;

      default:
        throw "Unsupported arguments";
    }
    targetEncoding = encoding;
  }
  switch (targetEncoding) {
    case GP.HEX:
      if (!this.hasBuffer) {
        return Convert.stringToHex(this.value);
      } else {
        return this.value.toString('hex');
      }
    case GP.ASCII:
      if (!this.hasBuffer) {
        return this.value;
      } else {
        return this.value.toString();
      }
    default:
      throw "Unsupported";
  }
}

ByteString.prototype.toStringIE = function(encoding) {
  return this.toString(encoding);
}

ByteString.prototype.toBuffer = function() {
  return this.value;
}

'use strict';

angular.module('copayApp.services')
  .factory('localStorageService', function(platformInfo, $timeout, $log) {
    var isNW = platformInfo.isNW;
    var isChromeApp = platformInfo.isChromeApp;
    var root = {};
    var ls = ((typeof window.localStorage !== "undefined") ? window.localStorage : null);

    if (isChromeApp && !isNW && !ls) {
      $log.info('Using CHROME storage');
      ls = chrome.storage.local;
    }


    if (!ls)
      throw new Error('localstorage not available');

    root.get = function(k, cb) {
      if (isChromeApp || isNW) {
        chrome.storage.local.get(k,
          function(data) {
            //TODO check for errors
            return cb(null, data[k]);
          });
      } else {
        return cb(null, ls.getItem(k));
      }
    };

    /**
     * Same as setItem, but fails if an item already exists
     */
    root.create = function(name, value, callback) {
      root.get(name,
        function(err, data) {
          if (data) {
            return callback('EEXISTS');
          } else {
            return root.set(name, value, callback);
          }
        });
    };

    root.set = function(k, v, cb) {
      if (isChromeApp || isNW) {
        var obj = {};
        obj[k] = v;

        chrome.storage.local.set(obj, cb);
      } else {
        ls.setItem(k, v);
        return cb();
      }

    };

    root.remove = function(k, cb) {
      if (isChromeApp || isNW) {
        chrome.storage.local.remove(k, cb);
      } else {
        ls.removeItem(k);
        return cb();
      }

    };


    if (isNW) {
      $log.info('Using chrome storage for NW.JS');

      var ts = ls.getItem('migrationToChromeStorage');
      var p = ls.getItem('profile');

      root.get('profile', function(err, newP){
        // Need migration?
        if (!ts && !newP && p) {
          $log.info('### MIGRATING DATA! TO CHROME STORAGE');

          var j = 0;
          for (var i = 0; i < localStorage.length; i++) {
            var k = ls.key(i);
            var v = ls.getItem(k);

            $log.debug('   Key: ' + k);
            root.set(k, v, function() {
              j++;
              if (j == localStorage.length) {
                $log.info('### MIGRATION DONE');
                ls.setItem('migrationToChromeStorage', Date.now())
                ls = chrome.storage.local;
              }
            })
          }
        } else if (p) {
          $log.info('# Data already migrated to Chrome storage.' + (ts||''));
        }
      });
    }


    return root;
  });

'use strict';
angular.module('copayApp.services')
  .factory('logHeader', function($log, platformInfo) {
    $log.info('Starting ColuWallet v' + window.version + ' #' + window.commitHash);
    $log.info('Client: '+ JSON.stringify(platformInfo) );
    return {};
  });

'use strict';

angular.module('copayApp.services').factory('nodeWebkit', function nodeWebkitFactory() {
  var root = {};

  var isNodeWebkit = function() {
    var isNode = (typeof process !== "undefined" && typeof require !== "undefined");
    if(isNode) {
      try {
        return (typeof require('nw.gui') !== "undefined");
      } catch(e) {
        return false;
      }
    }
  };

  root.readFromClipboard = function() {
    if (!isNodeWebkit()) return;
    var gui = require('nw.gui');
    var clipboard = gui.Clipboard.get();
    return clipboard.get();
  };

  root.writeToClipboard = function(text) {
    if (!isNodeWebkit()) return;
    var gui = require('nw.gui');
    var clipboard = gui.Clipboard.get();
    return clipboard.set(text);
  };

  root.openExternalLink = function(url) {
    if (!isNodeWebkit()) return;
    var gui = require('nw.gui');
    return gui.Shell.openExternal(url);
  };

  return root;
});

'use strict';

angular.module('copayApp.services').
factory('notification', function($timeout, platformInfo) {

    var isCordova = platformInfo.isCordova;
    var notifications = [];

    /*
    ls.getItem('notifications', function(err, data) {
      if (data) {
        notifications = JSON.parse(data);
      }
    });
    */

    var queue = [];
    var settings = {
      info: {
        duration: 6000,
        enabled: true
      },
      funds: {
        duration: 7000,
        enabled: true
      },
      version: {
        duration: 60000,
        enabled: true
      },
      warning: {
        duration: 7000,
        enabled: true
      },
      error: {
        duration: 7000,
        enabled: true
      },
      success: {
        duration: 5000,
        enabled: true
      },
      progress: {
        duration: 0,
        enabled: true
      },
      custom: {
        duration: 35000,
        enabled: true
      },
      details: true,
      localStorage: false,
      html5Mode: false,
      html5DefaultIcon: 'img/favicon.ico'
    };

    function html5Notify(icon, title, content, ondisplay, onclose) {
      if (window.webkitNotifications && window.webkitNotifications.checkPermission() === 0) {
        if (!icon) {
          icon = 'img/favicon.ico';
        }
        var noti = window.webkitNotifications.createNotification(icon, title, content);
        if (typeof ondisplay === 'function') {
          noti.ondisplay = ondisplay;
        }
        if (typeof onclose === 'function') {
          noti.onclose = onclose;
        }
        noti.show();
      } else {
        settings.html5Mode = false;
      }
    }


    return {

      /* ========== SETTINGS RELATED METHODS =============*/

      disableHtml5Mode: function() {
        settings.html5Mode = false;
      },

      disableType: function(notificationType) {
        settings[notificationType].enabled = false;
      },

      enableHtml5Mode: function() {
        // settings.html5Mode = true;
        settings.html5Mode = this.requestHtml5ModePermissions();
      },

      enableType: function(notificationType) {
        settings[notificationType].enabled = true;
      },

      getSettings: function() {
        return settings;
      },

      toggleType: function(notificationType) {
        settings[notificationType].enabled = !settings[notificationType].enabled;
      },

      toggleHtml5Mode: function() {
        settings.html5Mode = !settings.html5Mode;
      },

      requestHtml5ModePermissions: function() {
        if (window.webkitNotifications) {
          if (window.webkitNotifications.checkPermission() === 0) {
            return true;
          } else {
            window.webkitNotifications.requestPermission(function() {
              if (window.webkitNotifications.checkPermission() === 0) {
                settings.html5Mode = true;
              } else {
                settings.html5Mode = false;
              }
            });
            return false;
          }
        } else {
          return false;
        }
      },


      /* ============ QUERYING RELATED METHODS ============*/

      getAll: function() {
        // Returns all notifications that are currently stored
        return notifications;
      },

      getQueue: function() {
        return queue;
      },

      /* ============== NOTIFICATION METHODS ==============*/

      info: function(title, content, userData) {
        return this.awesomeNotify('info', 'fi-info', title, content, userData);
      },

      funds: function(title, content, userData) {
        return this.awesomeNotify('funds', 'icon-receive', title, content, userData);
      },

      version: function(title, content, severe) {
        return this.awesomeNotify('version', severe ? 'fi-alert' : 'fi-flag', title, content);
      },

      error: function(title, content, userData) {
        return this.awesomeNotify('error', 'fi-x', title, content, userData);
      },

      success: function(title, content, userData) {
        return this.awesomeNotify('success', 'fi-check', title, content, userData);
      },

      warning: function(title, content, userData) {
        return this.awesomeNotify('warning', 'fi-alert', title, content, userData);
      },

      new: function(title, content, userData) {
        return this.awesomeNotify('warning', 'fi-plus', title, content, userData);
      },

      sent: function(title, content, userData) {
        return this.awesomeNotify('warning', 'icon-paperplane', title, content, userData);
      },

      awesomeNotify: function(type, icon, title, content, userData) {
        /**
         * Supposed to wrap the makeNotification method for drawing icons using font-awesome
         * rather than an image.
         *
         * Need to find out how I'm going to make the API take either an image
         * resource, or a font-awesome icon and then display either of them.
         * Also should probably provide some bits of color, could do the coloring
         * through classes.
         */
        // image = '<i class="icon-' + image + '"></i>';
        return this.makeNotification(type, false, icon, title, content, userData);
      },

      notify: function(image, title, content, userData) {
        // Wraps the makeNotification method for displaying notifications with images
        // rather than icons
        return this.makeNotification('custom', image, true, title, content, userData);
      },

      makeNotification: function(type, image, icon, title, content, userData) {
        var notification = {
          'type': type,
          'image': image,
          'icon': icon,
          'title': title,
          'content': content,
          'timestamp': +new Date(),
          'userData': userData
        };

        notifications.push(notification);

        if (settings.html5Mode) {
          html5Notify(image, title, content, function() {
            // inner on display function
          }, function() {
            // inner on close function
          });
        }

        //this is done because html5Notify() changes the variable settings.html5Mode
        if (!settings.html5Mode) {
          queue.push(notification);
          $timeout(function removeFromQueueTimeout() {
            queue.splice(queue.indexOf(notification), 1);
          }, settings[type].duration);
        }

        // Mobile notification
        if (window && window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate([200, 100, 200]);
        };

        if (document.hidden && (type == 'info' || type == 'funds') && !isCordova) {
          new window.Notification(title, {
            body: content,
            icon: 'img/notification.png'
          });
        }

        this.save();
        return notification;
      },


      /* ============ PERSISTENCE METHODS ============ */

      save: function() {
        // Save all the notifications into localStorage
        if (settings.localStorage) {
          localStorage.setItem('notifications', JSON.stringify(notifications));
        }
      },

      restore: function() {
        // Load all notifications from localStorage
      },

      clear: function() {
        notifications = [];
        this.save();
      }

    };
  }
).directive('notifications', function(notification, $compile) {
  /**
   *
   * It should also parse the arguments passed to it that specify
   * its position on the screen like "bottom right" and apply those
   * positions as a class to the container element
   *
   * Finally, the directive should have its own controller for
   * handling all of the notifications from the notification service
   */
  function link(scope, element, attrs) {
    var position = attrs.notifications;
    position = position.split(' ');
    element.addClass('dr-notification-container');
    for (var i = 0; i < position.length; i++) {
      element.addClass(position[i]);
    }
  }

  return {
    restrict: 'A',
    scope: {},
    templateUrl: 'views/includes/notifications.html',
    link: link,
    controller: ['$scope',
      function NotificationsCtrl($scope) {
        $scope.queue = notification.getQueue();

        $scope.removeNotification = function(noti) {
          $scope.queue.splice($scope.queue.indexOf(noti), 1);
        };
      }
    ]

  };
});

'use strict';
angular.module('copayApp.services')
  .factory('notificationService', function profileServiceFactory($filter, notification, lodash, configService, gettext) {

    var root = {};

    var groupingTime = 5000;
    var lastNotificationOnWallet = {};

    root.getLast = function(walletId) {
      var last = lastNotificationOnWallet[walletId];
      if (!last) return null;

      return Date.now() - last.ts < groupingTime ? last : null;
    };

    root.storeLast = function(notificationData, walletId) {

      if (notificationData.type == 'NewAddress')
        return;

      lastNotificationOnWallet[walletId] = {
        creatorId: notificationData.creatorId,
        type: notificationData.type,
        ts: Date.now(),
      };
    };

    root.shouldSkip = function(notificationData, last) {
      if (!last) return false;

      // rules...
      if (last.type === 'NewTxProposal' &&
        notificationData.type === 'TxProposalAcceptedBy')
        return true;

      if (last.type === 'TxProposalFinallyAccepted' &&
        notificationData.type === 'NewOutgoingTx')
        return true;

      if (last.type === 'TxProposalRejectedBy' &&
        notificationData.type === 'TxProposalFinallyRejected')
        return true;

      return false;
    };


    root.newBWCNotification = function(notificationData, walletId, walletName) {
      var last = root.getLast(walletId);
      root.storeLast(notificationData, walletId);

      if (root.shouldSkip(notificationData, last))
        return;

      var config = configService.getSync();
      config.colorFor = config.colorFor || {};
      config.aliasFor = config.aliasFor || {};
      var color = config.colorFor[walletId] || '#4A90E2';
      var name = config.aliasFor[walletId] || walletName;

      switch (notificationData.type) {
        case 'NewTxProposal':
          notification.new(gettext('New Payment Proposal'),
            name, {
              color: color
            });
          break;
        case 'TxProposalAcceptedBy':
          notification.success(gettext('Payment Proposal Signed by Copayer'),
            name, {
              color: color
            });
          break;
        case 'TxProposalRejectedBy':
          notification.error(gettext('Payment Proposal Rejected by Copayer'),
            name, {
              color: color
            });
          break;
        case 'TxProposalFinallyRejected':
          notification.error(gettext('Payment Proposal Rejected'),
            name, {
              color: color
            });
          break;
        case 'NewOutgoingTxByThirdParty':
        case 'NewOutgoingTx':
          notification.sent(gettext('Payment Sent'),
            name, {
              color: color
            });
          break;
        case 'NewIncomingTx':
          notification.funds(gettext('Funds received'),
            name, {
              color: color
            });
          break;
        case 'ScanFinished':
          notification.success(gettext('Scan Finished'),
            name, {
              color: color
            });
          break;

        case 'NewCopayer':
          // No UX notification
          break;
        case 'BalanceUpdated':
          // No UX notification
          break;
      }
    };

    return root;
  });

'use strict';

angular.module('copayApp.services').factory('ongoingProcess', function($log, $timeout, $filter, lodash, $ionicLoading, gettext, platformInfo) {
  var root = {};
  var isCordova = platformInfo.isCordova;

  var ongoingProcess = {};

  var processNames = {
    'scanning': gettext('Scanning Wallet funds...'),
    'recreating': gettext('Recreating Wallet...'),
    'generatingCSV': gettext('Generating .csv file...'),
    'creatingTx': gettext('Creating transaction'),
    'sendingTx': gettext('Sending transaction'),
    'signingTx': gettext('Signing transaction'),
    'broadcastingTx': gettext('Broadcasting transaction'),
    'rejectTx': gettext('Rejecting payment proposal'),
    'removeTx': gettext('Deleting payment proposal'),
    'fetchingPayPro': gettext('Fetching Payment Information'),
    'calculatingFee': gettext('Calculating fee'),
    'joiningWallet': gettext('Joining Wallet...'),
    'retrivingInputs': gettext('Retrieving inputs information'),
    'creatingWallet': gettext('Creating Wallet...'),
    'validatingWallet': gettext('Validating wallet integrity...'),
    'connectingledger': gettext('Waiting for Ledger...'),
    'connectingtrezor': gettext('Waiting for Trezor...'),
    'validatingWords': gettext('Validating recovery phrase...'),
    'connectingCoinbase': gettext('Connecting to Coinbase...'),
    'connectingGlidera': gettext('Connecting to Glidera...'),
    'importingWallet': gettext('Importing Wallet...'),
    'sweepingWallet': gettext('Sweeping Wallet...'),
    'deletingWallet': gettext('Deleting Wallet...'),
    'extractingWalletInfo': gettext('Extracting Wallet Information...'),
  };

  root.clear = function() {
    ongoingProcess = {};
    if (isCordova) {
      window.plugins.spinnerDialog.hide();
    } else {
      $ionicLoading.hide();
    }
  };

  root.get = function(processName) {
    return ongoingProcess[processName];
  };

  root.set = function(processName, isOn) {
    $log.debug('ongoingProcess', processName, isOn);
    root[processName] = isOn;
    ongoingProcess[processName] = isOn;

    var name;
    root.any = lodash.any(ongoingProcess, function(isOn, processName) {
      if (isOn)
        name = name || processName;
      return isOn;
    });
    // The first one
    root.onGoingProcessName = name;

    var showName = $filter('translate')(processNames[name] || name);

    if (root.onGoingProcessName) {
      if (isCordova) {
        window.plugins.spinnerDialog.show(null, showName, true);
      } else {

        var tmpl = '<ion-spinner class="spinner-stable" icon="lines"></ion-spinner>' + showName;
        $ionicLoading.show({
          template: tmpl
        });
      }
    } else {
      if (isCordova) {
        window.plugins.spinnerDialog.hide();
      } else {
        $ionicLoading.hide();
      }
    }
  };

  return root;
});

'use strict';

angular.module('copayApp.services').factory('openURLService', function($rootScope, $ionicHistory, $document, $log, $state, go, platformInfo, lodash, profileService) {
  var root = {};

  root.registeredUriHandlers = [{
    name: 'Bitcoin BIP21 URL',
    startsWith: 'bitcoin:',
    transitionTo: 'uripayment',
  }, {
    name: 'Glidera Authentication Callback',
    startsWith: 'copay:glidera',
    transitionTo: 'uriglidera',
  }, {
    name: 'Coinbase Authentication Callback',
    startsWith: 'copay:coinbase',
    transitionTo: 'uricoinbase',
  }];


  var handleOpenURL = function(args) {
    $log.info('Handling Open URL: ' + JSON.stringify(args));

    if (!profileService.isBound) {
      $log.warn('Profile not bound yet. Waiting');

      return $rootScope.$on('Local/ProfileBound', function() {
        // Wait ux to settle
        setTimeout(function() {
          $log.warn('Profile ready, retrying...');
          handleOpenURL(args);
        }, 2000);
      });
    };

    // Stop it from caching the first view as one to return when the app opens
    $ionicHistory.nextViewOptions({
      historyRoot: true,
      disableBack: true,
      disableAnimation: true
    });
    var url = args.url;
    if (!url) {
      $log.error('No url provided');
      return;
    };

    if (url) {
      if ('cordova' in window) {
        window.cordova.removeDocumentEventHandler('handleopenurl');
        window.cordova.addStickyDocumentEventHandler('handleopenurl');
      }
      document.removeEventListener('handleopenurl', handleOpenURL);
    }

    document.addEventListener('handleopenurl', handleOpenURL, false);

    var x = lodash.find(root.registeredUriHandlers, function(x) {
      return url.indexOf(x.startsWith) == 0 ||
        url.indexOf('web+' + x.startsWith) == 0 || // web protocols
        url.indexOf(x.startsWith.replace(':', '://')) == 0 // from mobile devices
      ;
    });

    if (x) {
      $log.debug('openURL GOT ' + x.name + ' URL');
      return $state.transitionTo(x.transitionTo, {
        url: url
      });
    } else {
      $log.warn('Unknown URL! : ' + url);
    }
  };

  var handleResume = function() {
    $log.debug('Handle Resume @ openURL...');
    document.addEventListener('handleopenurl', handleOpenURL, false);
  };

  root.init = function() {
    $log.debug('Initializing openURL');
    document.addEventListener('handleopenurl', handleOpenURL, false);
    document.addEventListener('resume', handleResume, false);

    if (platformInfo.isChromeApp) {
      $log.debug('Registering Chrome message listener');
      chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
          if (request.url) {
            handleOpenURL(request.url);
          }
        });
    } else if (platformInfo.isNW) {
      var gui = require('nw.gui');

      // This event is sent to an existent instance of Copay (only for standalone apps)
      gui.App.on('open', function(pathData) {
        if (pathData.indexOf('bitcoin:') != -1) {
          $log.debug('Bitcoin URL found');
          handleOpenURL({
            url: pathData.substring(pathData.indexOf('bitcoin:'))
          });
        } else if (pathData.indexOf('copay:') != -1) {
          $log.debug('Copay URL found');
          handleOpenURL({
            url: pathData.substring(pathData.indexOf('copay:'))
          });
        }
      });

      // Used at the startup of Copay
      var argv = gui.App.argv;
      if (argv && argv[0]) {
        handleOpenURL({
          url: argv[0]
        });
      }
    } else if (platformInfo.isDevel) {

      var base = window.location.origin + '/';
      var url = base + '#/uri/%s';

      if (navigator.registerProtocolHandler) {
        $log.debug('Registering Browser handlers base:' + base);
        navigator.registerProtocolHandler('bitcoin', url, 'Copay Bitcoin Handler');
        navigator.registerProtocolHandler('web+copay', url, 'Copay Wallet Handler');
      }
    }
  };

  root.registerHandler = function(x) {
    $log.debug('Registering URL Handler: ' + x.name);
    root.registeredUriHandlers.push(x);
  };

  root.handleURL = handleOpenURL;

  return root;
});

'use strict';

angular.module('copayApp.services').factory('platformInfo', function($window) {

  var ua = navigator ? navigator.userAgent : null;

  if (!ua) {
    console.log('Could not determine navigator. Using fixed string');
    ua = 'dummy user-agent';
  }

  // Fixes IOS WebKit UA
  ua = ua.replace(/\(\d+\)$/, '');

  var isNodeWebkit = function() {
    var isNode = (typeof process !== "undefined" && typeof require !== "undefined");
    if (isNode) {
      try {
        return (typeof require('nw.gui') !== "undefined");
      } catch (e) {
        return false;
      }
    }
  };


  // Detect mobile devices
  var ret = {
    isAndroid: !!ua.match(/Android/i),
    isIOS: /iPad|iPhone|iPod/.test(ua) && !$window.MSStream,
    isWP: !!ua.match(/IEMobile/i),
    isSafari: Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,
    ua: ua,
    isCordova: !!$window.cordova,
    isNW: isNodeWebkit(),
  };

  ret.isMobile = ret.isAndroid || ret.isIOS || ret.isWP;
  ret.isChromeApp = $window.chrome && chrome.runtime && chrome.runtime.id && !ret.isNW;
  ret.isDevel = !ret.isMobile && !ret.isChromeApp && !ret.isNW;

  return ret;
});

'use strict';
angular.module('copayApp.services')
  .factory('profileService', function profileServiceFactory($rootScope, $timeout, $filter, $log, sjcl, lodash, storageService, bwcService, configService, notificationService, pushNotificationsService, gettext, gettextCatalog, bwcError, uxLanguage, bitcore, platformInfo, walletService) {


    var isChromeApp = platformInfo.isChromeApp;
    var isCordova = platformInfo.isCordova;
    var isWP = platformInfo.isWP;
    var isIOS = platformInfo.isIOS;

    var root = {};
    var errors = bwcService.getErrors();
    var usePushNotifications = isCordova && !isWP;

    var FOREGROUND_UPDATE_PERIOD = 5;
    var BACKGROUND_UPDATE_PERIOD = 30;

    root.profile = null;
    root.focusedClient = null;
    root.walletClients = {};

    root.Utils = bwcService.getUtils();
    root.formatAmount = function(amount, fullPrecision) {
      var config = configService.getSync().wallet.settings;
      if (config.unitCode == 'sat') return amount;

      //TODO : now only works for english, specify opts to change thousand separator and decimal separator
      var opts = {
        fullPrecision: !!fullPrecision
      };
      return this.Utils.formatAmount(amount, config.unitCode, opts);
    };

    // Create the client
    var getBWSURL = function(walletId) {
      var config = configService.getSync();
      var defaults = configService.getDefaults();
      return ((config.bwsFor && config.bwsFor[walletId]) || defaults.bws.url);
    };

    var withBwsUrl = function(opts, walletId) {
      if (!opts.bwsurl) {
        opts.bwsurl = getBWSURL(walletId);
      }
      return opts;
    };

    root._setFocus = function(walletId, cb) {
      $log.debug('Set focus:', walletId);

      // Set local object
      if (walletId)
        root.focusedClient = root.walletClients[walletId];
      else
        root.focusedClient = [];

      if (lodash.isEmpty(root.focusedClient)) {
        root.focusedClient = root.walletClients[lodash.keys(root.walletClients)[0]];
      }

      // Still nothing?
      if (lodash.isEmpty(root.focusedClient)) {
        $rootScope.$emit('Local/NoWallets');
      } else {
        $rootScope.$emit('Local/NewFocusedWallet');

        // Set update period
        lodash.each(root.walletClients, function(client, id) {
          client.setNotificationsInterval(BACKGROUND_UPDATE_PERIOD);
        });
        root.focusedClient.setNotificationsInterval(FOREGROUND_UPDATE_PERIOD);
      }

      return cb();
    };

    root.setAndStoreFocus = function(walletId, cb) {
      root._setFocus(walletId, function() {
        storageService.storeFocusedWalletId(walletId, cb);
      });
    };

    // Adds a wallet client to profileService
    root.bindWalletClient = function(client, opts) {
      var opts = opts || {};
      var walletId = client.credentials.walletId;

      if ((root.walletClients[walletId] && root.walletClients[walletId].started) || opts.force) {
        return false;
      }

      root.walletClients[walletId] = client;
      root.walletClients[walletId].started = true;
      root.walletClients[walletId].doNotVerifyPayPro = isChromeApp;

      client.removeAllListeners();
      client.on('report', function(n) {
        $log.info('BWC Report:' + n);
      });

      client.on('notification', function(n) {
        $log.debug('BWC Notification:', n);
        notificationService.newBWCNotification(n,
          walletId, client.credentials.walletName);

        if (root.focusedClient.credentials.walletId == walletId) {
          $rootScope.$emit(n.type, n);
        } else {
          $rootScope.$apply();
        }
      });

      client.on('walletCompleted', function() {
        $log.debug('Wallet completed');

        root.updateCredentials(JSON.parse(client.export()), function() {
          $rootScope.$emit('Local/WalletCompleted', walletId);
        });
      });

      if (client.hasPrivKeyEncrypted() && !client.isPrivKeyEncrypted()) {
        $log.warn('Auto locking unlocked wallet:' + walletId);
        client.lock();
      }

      client.initialize({}, function(err) {
        if (err) {
          $log.error('Could not init notifications err:', err);
          return;
        }
        client.setNotificationsInterval(BACKGROUND_UPDATE_PERIOD);
      });

      return true;
    };

    var validationLock = false;

    root.runValidation = function(client, delay, retryDelay) {

      delay = delay || 500;
      retryDelay = retryDelay || 50;

      if (validationLock) {
        return $timeout(function() {
          $log.debug('ValidatingWallet Locked: Retrying in: ' + retryDelay);
          return root.runValidation(client, delay, retryDelay);
        }, retryDelay);
      }
      validationLock = true;

      // IOS devices are already checked
      var skipDeviceValidation = isIOS || root.profile.isDeviceChecked(platformInfo.ua);
      var walletId = client.credentials.walletId;

      $log.debug('ValidatingWallet: ' + walletId + ' skip Device:' + skipDeviceValidation);
      $timeout(function() {
        client.validateKeyDerivation({
          skipDeviceValidation: skipDeviceValidation,
        }, function(err, isOK) {
          validationLock = false;

          $log.debug('ValidatingWallet End:  ' + walletId + ' isOK:' + isOK);
          if (isOK) {
            root.profile.setChecked(platformInfo.ua, walletId);
          } else {
            $log.warn('Key Derivation failed for wallet:' + walletId);
            storageService.clearLastAddress(walletId, function() {});
          }

          root.storeProfileIfDirty();
          $rootScope.$emit('Local/ValidatingWalletEnded', walletId, isOK);
        });
      }, delay);
    };

    // Used when reading wallets from the profile
    root.bindWallet = function(credentials, cb) {
      if (!credentials.walletId)
        return cb('bindWallet should receive credentials JSON');

      var client = bwcService.getClient(JSON.stringify(credentials), {
        bwsurl: getBWSURL(credentials.walletId),
      });

      var skipKeyValidation = root.profile.isChecked(platformInfo.ua, credentials.walletId);
      if (!skipKeyValidation)
        root.runValidation(client, 500);

      $log.info('Binding wallet:' + credentials.walletId + ' Validating?:' + !skipKeyValidation);
      return cb(null, root.bindWalletClient(client));
    };

    root.bindProfile = function(profile, cb) {
      root.profile = profile;

      configService.get(function(err) {
        $log.debug('Preferences read');
        if (err) return cb(err);

        function bindWallets(cb) {
          var l = root.profile.credentials.length;
          var i = 0,
            totalBound = 0;

          if (!l) return cb();

          lodash.each(root.profile.credentials, function(credentials) {
            root.bindWallet(credentials, function(err, bound) {
              i++;
              totalBound += bound;
              if (i == l) {
                $log.info('Bound ' + totalBound + ' out of ' + l + ' wallets');
                if (totalBound)
                  $rootScope.$emit('Local/WalletListUpdated');
                return cb();
              }
            });
          });
        }

        bindWallets(function() {
          storageService.getFocusedWalletId(function(err, focusedWalletId) {
            if (err) return cb(err);
            root._setFocus(focusedWalletId, function() {
              if (usePushNotifications)
                root.pushNotificationsInit();

              root.isBound = true;
              $rootScope.$emit('Local/ProfileBound');

              root.isDisclaimerAccepted(function(val) {
                if (!val) {
                  return cb(new Error('NONAGREEDDISCLAIMER: Non agreed disclaimer'));
                }
                $rootScope.$emit('disclaimerAccepted');
                return cb();
              });
            });
          })
        });
      });
    };

    root.pushNotificationsInit = function() {
      var defaults = configService.getDefaults();
      var push = pushNotificationsService.init(root.walletClients);

      push.on('notification', function(data) {
        if (!data.additionalData.foreground) {
          $log.debug('Push notification event: ', data.message);

          $timeout(function() {
            var wallets = root.getWallets();
            var walletToFind = data.additionalData.walletId;

            var walletFound = lodash.find(wallets, function(w) {
              return (lodash.isEqual(walletToFind, sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(w.id))));
            });

            if (!walletFound) return $log.debug('Wallet not found');
            root.setAndStoreFocus(walletFound.id, function() {});
          }, 100);
        }
      });
    };

    root.loadAndBindProfile = function(cb) {
      storageService.getProfile(function(err, profile) {
        if (err) {
          $rootScope.$emit('Local/DeviceError', err);
          return cb(err);
        }
        if (!profile) {
          // Migration??
          storageService.tryToMigrate(function(err, migratedProfile) {
            if (err) return cb(err);
            if (!migratedProfile)
              return cb(new Error('NOPROFILE: No profile'));

            profile = migratedProfile;
            return root.bindProfile(profile, cb);
          })
        } else {
          $log.debug('Profile read');
          return root.bindProfile(profile, cb);
        }
      });
    };

    var seedWallet = function(opts, cb) {
      opts = opts || {};
      var walletClient = bwcService.getClient(null, withBwsUrl(opts));
      var network = opts.networkName || 'livenet';

      if (opts.mnemonic) {
        try {
          opts.mnemonic = root._normalizeMnemonic(opts.mnemonic);
          walletClient.seedFromMnemonic(opts.mnemonic, {
            network: network,
            passphrase: opts.passphrase,
            account: opts.account || 0,
            derivationStrategy: opts.derivationStrategy || 'BIP44',
          });

        } catch (ex) {
          $log.info(ex);
          return cb(gettext('Could not create: Invalid wallet recovery phrase'));
        }
      } else if (opts.extendedPrivateKey) {
        try {
          walletClient.seedFromExtendedPrivateKey(opts.extendedPrivateKey);
        } catch (ex) {
          $log.warn(ex);
          return cb(gettext('Could not create using the specified extended private key'));
        }
      } else if (opts.extendedPublicKey) {
        try {
          walletClient.seedFromExtendedPublicKey(opts.extendedPublicKey, opts.externalSource, opts.entropySource, {
            account: opts.account || 0,
            derivationStrategy: opts.derivationStrategy || 'BIP44',
          });
        } catch (ex) {
          $log.warn("Creating wallet from Extended Public Key Arg:", ex, opts);
          return cb(gettext('Could not create using the specified extended public key'));
        }
      } else {
        var lang = uxLanguage.getCurrentLanguage();
        try {
          walletClient.seedFromRandomWithMnemonic({
            network: network,
            passphrase: opts.passphrase,
            language: lang,
            account: 0,
          });
        } catch (e) {
          $log.info('Error creating recovery phrase: ' + e.message);
          if (e.message.indexOf('language') > 0) {
            $log.info('Using default language for recovery phrase');
            walletClient.seedFromRandomWithMnemonic({
              network: network,
              passphrase: opts.passphrase,
              account: 0,
            });
          } else {
            return cb(e);
          }
        }
      }
      return cb(null, walletClient);
    };

    // Creates a wallet on BWC/BWS
    var doCreateWallet = function(opts, cb) {
      $log.debug('Creating Wallet:', opts);
      $timeout(function() {
        seedWallet(opts, function(err, walletClient) {
          if (err) return cb(err);

          var name = opts.name || gettextCatalog.getString('Personal Wallet');
          var myName = opts.myName || gettextCatalog.getString('me');

          walletClient.createWallet(name, myName, opts.m, opts.n, {
            network: opts.networkName,
            singleAddress: opts.singleAddress,
            walletPrivKey: opts.walletPrivKey,
          }, function(err, secret) {
            if (err) return bwcError.cb(err, gettext('Error creating wallet'), cb);
            return cb(null, walletClient, secret);
          });
        });
      }, 50);
    };

    // Creates the default Copay profile and its wallet
    root.createDefaultProfile = function(opts, cb) {
      var p = Profile.create();

      if (opts.noWallet) {
        return cb(null, p);
      }

      opts.m = 1;
      opts.n = 1;
      opts.networkName = 'livenet';

      doCreateWallet(opts, function(err, walletClient) {
        if (err) return cb(err);

        p.addWallet(JSON.parse(walletClient.export()));
        return cb(null, p);
      });
    };

    // create and store a wallet
    root.createWallet = function(opts, cb) {
      doCreateWallet(opts, function(err, walletClient, secret) {
        if (err) return cb(err);

        root.addAndBindWalletClient(walletClient, {
          bwsurl: opts.bwsurl
        }, cb);
      });
    };

    // joins and stores a wallet
    root.joinWallet = function(opts, cb) {
      var walletClient = bwcService.getClient();
      $log.debug('Joining Wallet:', opts);

      try {
        var walletData = bwcService.parseSecret(opts.secret);

        // check if exist
        if (lodash.find(root.profile.credentials, {
            'walletId': walletData.walletId
          })) {
          return cb(gettext('Cannot join the same wallet more that once'));
        }
      } catch (ex) {
        $log.debug(ex);
        return cb(gettext('Bad wallet invitation'));
      }
      opts.networkName = walletData.network;
      $log.debug('Joining Wallet:', opts);

      seedWallet(opts, function(err, walletClient) {
        if (err) return cb(err);

        walletClient.joinWallet(opts.secret, opts.myName || 'me', {}, function(err) {
          if (err) return bwcError.cb(err, gettext('Could not join wallet'), cb);
          root.addAndBindWalletClient(walletClient, {
            bwsurl: opts.bwsurl
          }, cb);
        });
      });
    };

    root.getClient = function(walletId) {
      return root.walletClients[walletId];
    };

    root.deleteWalletClient = function(client, cb) {
      var walletId = client.credentials.walletId;

      pushNotificationsService.unsubscribe(root.getClient(walletId), function(err) {
        if (err) $log.warn('Unsubscription error: ' + err.message);
        else $log.debug('Unsubscribed from push notifications service');
      });

      $log.debug('Deleting Wallet:', client.credentials.walletName);
      client.removeAllListeners();

      root.profile.deleteWallet(walletId);

      delete root.walletClients[walletId];
      root.focusedClient = null;


      storageService.removeAllWalletData(walletId, function(err) {
        if (err) $log.warn(err);
      });


      $timeout(function() {
        $rootScope.$emit('Local/WalletListUpdated');

        root.setAndStoreFocus(null, function() {
          storageService.storeProfile(root.profile, function(err) {
            if (err) return cb(err);
            return cb();
          });
        });
      });
    };

    root.setMetaData = function(walletClient, addressBook, cb) {
      storageService.getAddressbook(walletClient.credentials.network, function(err, localAddressBook) {
        var localAddressBook1 = {};
        try {
          localAddressBook1 = JSON.parse(localAddressBook);
        } catch (ex) {
          $log.warn(ex);
        }
        var mergeAddressBook = lodash.merge(addressBook, localAddressBook1);
        storageService.setAddressbook(walletClient.credentials.network, JSON.stringify(addressBook), function(err) {
          if (err) return cb(err);
          return cb(null);
        });
      });
    }

    // Adds and bind a new client to the profile
    root.addAndBindWalletClient = function(client, opts, cb) {
      if (!client || !client.credentials)
        return cb(gettext('Could not access wallet'));

      var walletId = client.credentials.walletId

      if (!root.profile.addWallet(JSON.parse(client.export())))
        return cb(gettext('Wallet already in Copay'));


      var skipKeyValidation = root.profile.isChecked(platformInfo.ua, walletId);
      if (!skipKeyValidation)
        root.runValidation(client);

      root.bindWalletClient(client);
      $rootScope.$emit('Local/WalletListUpdated', client);

      var saveBwsUrl = function(cb) {
        var defaults = configService.getDefaults();
        var bwsFor = {};
        bwsFor[walletId] = opts.bwsurl || defaults.bws.url;

        // Dont save the default
        if (bwsFor[walletId] == defaults.bws.url)
          return cb();

        configService.set({
          bwsFor: bwsFor,
        }, function(err) {
          if (err) $log.warn(err);
          return cb();
        });
      };

      walletService.updateRemotePreferences(client, {}, function() {
        $log.debug('Remote preferences saved for:' + walletId)
      });

      saveBwsUrl(function() {
        root.setAndStoreFocus(walletId, function() {
          storageService.storeProfile(root.profile, function(err) {
            var config = configService.getSync();
            if (config.pushNotifications.enabled)
              pushNotificationsService.enableNotifications(root.walletClients);
            return cb(err, walletId);
          });

        });
      });
    };

    root.storeProfileIfDirty = function(cb) {
      if (root.profile.dirty) {
        storageService.storeProfile(root.profile, function(err) {
          $log.debug('Saved modified Profile');
          if (cb) return cb(err);
        });
      } else {
        if (cb) return cb();
      };
    };

    root.importWallet = function(str, opts, cb) {

      var walletClient = bwcService.getClient(null, opts);

      $log.debug('Importing Wallet:', opts);
      try {
        walletClient.import(str, {
          compressed: opts.compressed,
          password: opts.password
        });
      } catch (err) {
        return cb(gettext('Could not import. Check input file and spending password'));
      }

      if (walletClient.hasPrivKeyEncrypted()) {
        try {
          walletClient.disablePrivateKeyEncryption();
        } catch (e) {
          $log.warn(e);
        }
      }

      str = JSON.parse(str);

      var addressBook = str.addressBook || {};

      root.addAndBindWalletClient(walletClient, {
        bwsurl: opts.bwsurl
      }, function(err, walletId) {
        if (err) return cb(err);
        root.setMetaData(walletClient, addressBook, function(error) {
          if (error) $log.warn(error);
          return cb(err, walletId);
        });
      });
    };

    root.importExtendedPrivateKey = function(xPrivKey, opts, cb) {
      var walletClient = bwcService.getClient(null, opts);
      $log.debug('Importing Wallet xPrivKey');

      walletClient.importFromExtendedPrivateKey(xPrivKey, opts, function(err) {
        if (err) {
          if (err instanceof errors.NOT_AUTHORIZED)
            return cb(err);

          return bwcError.cb(err, gettext('Could not import'), cb);
        }

        root.addAndBindWalletClient(walletClient, {
          bwsurl: opts.bwsurl
        }, cb);
      });
    };

    root._normalizeMnemonic = function(words) {
      var isJA = words.indexOf('\u3000') > -1;
      var wordList = words.split(/[\u3000\s]+/);

      return wordList.join(isJA ? '\u3000' : ' ');
    };

    root.importMnemonic = function(words, opts, cb) {
      var walletClient = bwcService.getClient(null, opts);

      $log.debug('Importing Wallet Mnemonic');

      words = root._normalizeMnemonic(words);
      walletClient.importFromMnemonic(words, {
        network: opts.networkName,
        passphrase: opts.passphrase,
        account: opts.account || 0,
      }, function(err) {
        if (err) {
          if (err instanceof errors.NOT_AUTHORIZED)
            return cb(err);

          return bwcError.cb(err, gettext('Could not import'), cb);
        }

        root.addAndBindWalletClient(walletClient, {
          bwsurl: opts.bwsurl
        }, cb);
      });
    };

    root.importExtendedPublicKey = function(opts, cb) {
      var walletClient = bwcService.getClient(null, opts);
      $log.debug('Importing Wallet XPubKey');

      walletClient.importFromExtendedPublicKey(opts.extendedPublicKey, opts.externalSource, opts.entropySource, {
        account: opts.account || 0,
        derivationStrategy: opts.derivationStrategy || 'BIP44',
      }, function(err) {
        if (err) {

          // in HW wallets, req key is always the same. They can't addAccess.
          if (err instanceof errors.NOT_AUTHORIZED)
            err.name = 'WALLET_DOES_NOT_EXIST';

          return bwcError.cb(err, gettext('Could not import'), cb);
        }

        root.addAndBindWalletClient(walletClient, {
          bwsurl: opts.bwsurl
        }, cb);
      });
    };

    root.create = function(opts, cb) {
      $log.info('Creating profile', opts);
      var defaults = configService.getDefaults();

      configService.get(function(err) {
        root.createDefaultProfile(opts, function(err, p) {
          if (err) return cb(err);

          storageService.storeNewProfile(p, function(err) {
            if (err) return cb(err);
            root.bindProfile(p, function(err) {
              // ignore NONAGREEDDISCLAIMER
              if (err && err.toString().match('NONAGREEDDISCLAIMER')) return cb();
              return cb(err);
            });
          });
        });
      });
    };

    root.setDisclaimerAccepted = function(cb) {
      root.profile.disclaimerAccepted = true;
      storageService.storeProfile(root.profile, function(err) {
        return cb(err);
      });
    };

    root.isDisclaimerAccepted = function(cb) {
      var disclaimerAccepted = root.profile && root.profile.disclaimerAccepted;
      if (disclaimerAccepted)
        return cb(true);

      // OLD flag
      storageService.getCopayDisclaimerFlag(function(err, val) {
        if (val) {
          root.profile.disclaimerAccepted = true;
          return cb(true);
        } else {
          return cb();
        }
      });
    };

    root.updateCredentials = function(credentials, cb) {
      root.profile.updateWallet(credentials);
      storageService.storeProfile(root.profile, cb);
    };

    root.getClients = function() {
      return lodash.values(root.walletClients);
    };

    root.needsBackup = function(client, cb) {

      if (!walletService.needsBackup(client))
        return cb(false);

      storageService.getBackupFlag(client.credentials.walletId, function(err, val) {
        if (err) $log.error(err);
        if (val) return cb(false);
        return cb(true);
      });
    };

    root.isReady = function(client, cb) {
      if (!client.isComplete())
        return cb('WALLET_NOT_COMPLETE');

      root.needsBackup(client, function(needsBackup) {
        if (needsBackup)
          return cb('WALLET_NEEDS_BACKUP');
        return cb();
      });
    };

    root.getWallets = function(network, n) {
      if (!root.profile) return [];

      var config = configService.getSync();
      config.colorFor = config.colorFor || {};
      config.aliasFor = config.aliasFor || {};
      var ret = lodash.map(root.profile.credentials, function(c) {
        return {
          m: c.m,
          n: c.n,
          name: config.aliasFor[c.walletId] || c.walletName,
          id: c.walletId,
          network: c.network,
          color: config.colorFor[c.walletId] || '#4A90E2',
          copayerId: c.copayerId
        };
      });
      if (network) {
        ret = lodash.filter(ret, function(w) {
          return (w.network == network);
        });
      }
      if (n) {
        ret = lodash.filter(ret, function(w) {
          return (w.n == n);
        });
      }

      return lodash.sortBy(ret, 'name');
    };

    return root;
  });

'use strict';
angular.module('copayApp.services')
  .factory('pushNotificationsService', function($log, platformInfo, storageService, configService, lodash, $timeout) {
    var root = {};
    var isCordova = platformInfo.isCordova;
    var isWP = platformInfo.isWP;
    var isIOS = platformInfo.isIOS;
    var isAndroid = platformInfo.isAndroid;

    var usePushNotifications = isCordova && !isWP;

    root.init = function(walletsClients) {
      var defaults = configService.getDefaults();
      var push = PushNotification.init(defaults.pushNotifications.config);

      push.on('registration', function(data) {
        if (root.token) return;
        $log.debug('Starting push notification registration');
        root.token = data.registrationId;
        var config = configService.getSync();
        if (config.pushNotifications.enabled) root.enableNotifications(walletsClients);
      });

      return push;
    }

    root.enableNotifications = function(walletsClients) {
      if (!usePushNotifications) return;

      var config = configService.getSync();
      if (!config.pushNotifications.enabled) return;

      if (!root.token) {
        $log.warn('No token available for this device. Cannot set push notifications');
        return;
      }

      lodash.forEach(walletsClients, function(walletClient) {
        var opts = {};
        opts.type = isIOS ? "ios" : isAndroid ? "android" : null;
        opts.token = root.token;
        root.subscribe(opts, walletClient, function(err, response) {
          if (err) $log.warn('Subscription error: ' + err.message + ': ' + JSON.stringify(opts));
          else $log.debug('Subscribed to push notifications service: ' + JSON.stringify(response));
        });
      });
    }

    root.disableNotifications = function(walletsClients) {
      if (!usePushNotifications) return;

      lodash.forEach(walletsClients, function(walletClient) {
        root.unsubscribe(walletClient, function(err) {
          if (err) $log.warn('Unsubscription error: ' + err.message);
          else $log.debug('Unsubscribed from push notifications service');
        });
      });
    }

    root.subscribe = function(opts, walletClient, cb) {
      if (!usePushNotifications) return cb();

      var config = configService.getSync();
      if (!config.pushNotifications.enabled) return;
      $timeout(function () {
        walletClient.pushNotificationsSubscribe(opts, function (err, resp) {
          if (err) return cb(err);
          return cb(null, resp);
        });
      }, 2000)
    }

    root.unsubscribe = function(walletClient, cb) {
      if (!usePushNotifications) return cb();

      walletClient.pushNotificationsUnsubscribe(function(err) {
        if (err) return cb(err);
        return cb(null);
      });
    }

    return root;

  });

'use strict';

//var util = require('util');
//var _ = require('lodash');
//var log = require('../util/log');
//var preconditions = require('preconditions').singleton();
//var request = require('request');

/*
  This class lets interfaces with BitPay's exchange rate API.
*/

var RateService = function(opts) {
  var self = this;

  opts = opts || {};
  self.httprequest = opts.httprequest; // || request;
  self.lodash = opts.lodash;

  self.SAT_TO_BTC = 1 / 1e8;
  self.BTC_TO_SAT = 1e8;
  self.UNAVAILABLE_ERROR = 'Service is not available - check for service.isAvailable() or use service.whenAvailable()';
  self.UNSUPPORTED_CURRENCY_ERROR = 'Currency not supported';

  self._url = opts.url || 'https://insight.bitpay.com:443/api/rates';

  self._isAvailable = false;
  self._rates = {};
  self._alternatives = [];
  self._queued = [];

  self._fetchCurrencies();
};


var _instance;
RateService.singleton = function(opts) {
  if (!_instance) {
    _instance = new RateService(opts);
  }
  return _instance;
};

RateService.prototype._fetchCurrencies = function() {
  var self = this;

  var backoffSeconds = 5;
  var updateFrequencySeconds = 5 * 60;
  var rateServiceUrl = 'https://bitpay.com/api/rates';

  var retrieve = function() {
    //log.info('Fetching exchange rates');
    self.httprequest.get(rateServiceUrl).success(function(res) {
      self.lodash.each(res, function(currency) {
        self._rates[currency.code] = currency.rate;
        self._alternatives.push({
          name: currency.name,
          isoCode: currency.code,
          rate: currency.rate
        });
      });
      self._isAvailable = true;
      self.lodash.each(self._queued, function(callback) {
        setTimeout(callback, 1);
      });
      setTimeout(retrieve, updateFrequencySeconds * 1000);
    }).error(function(err) {
      //log.debug('Error fetching exchange rates', err);
      setTimeout(function() {
        backoffSeconds *= 1.5;
        retrieve();
      }, backoffSeconds * 1000);
      return;
    });

  };

  retrieve();
};

RateService.prototype.getRate = function(code) {
  return this._rates[code];
};

RateService.prototype.getHistoricRate = function(code, date, cb) {
  var self = this;

  self.httprequest.get(self._url + '/' + code + '?ts=' + date)
    .success(function(body) {
      return cb(null, body.rate)
    })
    .error(function(err) {
      return cb(err)
    });

};

RateService.prototype.getHistoricRates = function(code, dates, cb) {
  var self = this;

  var tsList = dates.join(',');

  self.httprequest.get(self._url + '/' + code + '?ts=' + tsList)
    .success(function(body) {
      if (!self.lodash.isArray(body)) {
        body = [{
          ts: dates[0],
          rate: body.rate
        }];
      }
      return cb(null, body);
    })
    .error(function(err) {
      return cb(err)
    });
};

RateService.prototype.getAlternatives = function() {
  return this._alternatives;
};

RateService.prototype.isAvailable = function() {
  return this._isAvailable;
};

RateService.prototype.whenAvailable = function(callback) {
  if (this.isAvailable()) {
    setTimeout(callback, 1);
  } else {
    this._queued.push(callback);
  }
};

RateService.prototype.toFiat = function(satoshis, code) {
  if (!this.isAvailable()) {
    return null;
  }

  return satoshis * this.SAT_TO_BTC * this.getRate(code);
};

RateService.prototype.toFiatHistoric = function(satoshis, code, date, cb) {
  var self = this;

  self.getHistoricRate(code, date, function(err, rate) {
    if (err) return cb(err);
    return cb(null, satoshis * self.SAT_TO_BTC * rate);
  });
};

RateService.prototype.fromFiat = function(amount, code) {
  if (!this.isAvailable()) {
    return null;
  }
  return amount / this.getRate(code) * this.BTC_TO_SAT;
};

RateService.prototype.listAlternatives = function() {
  var self = this;
  if (!this.isAvailable()) {
    return [];
  }

  return self.lodash.map(this.getAlternatives(), function(item) {
    return {
      name: item.name,
      isoCode: item.isoCode
    }
  });
};

angular.module('copayApp.services').factory('rateService', function($http, lodash) {
  // var cfg = _.extend(config.rates, {
  //   httprequest: $http
  // });

  var cfg = {
    httprequest: $http,
    lodash: lodash
  };
  return RateService.singleton(cfg);
});


'use strict';
angular.module('copayApp.services')
  .factory('sjcl', function bitcoreFactory(bwcService) {
    var sjcl = bwcService.getSJCL();
    return sjcl;
  });

'use strict';
angular.module('copayApp.services')
  .factory('storageService', function(logHeader, fileStorageService, localStorageService, sjcl, $log, lodash, platformInfo, instanceConfig) {

    var root = {};

    // File storage is not supported for writing according to
    // https://github.com/apache/cordova-plugin-file/#supported-platforms
    var shouldUseFileStorage = platformInfo.isCordova && !platformInfo.isWP;
    $log.debug('Using file storage:', shouldUseFileStorage);


    var storage = shouldUseFileStorage ? fileStorageService : localStorageService;

    var getUUID = function(cb) {
      // TO SIMULATE MOBILE
      //return cb('hola');
      if (!window || !window.plugins || !window.plugins.uniqueDeviceID)
        return cb(null);

      window.plugins.uniqueDeviceID.get(
        function(uuid) {
          return cb(uuid);
        }, cb);
    };

    var decryptOnMobile = function(text, cb) {
      var json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        $log.warn('Could not open profile:' + text);

        var i = text.lastIndexOf('}{');
        if (i > 0) {
          text = text.substr(i + 1);
          $log.warn('trying last part only:' + text);
          try {
            json = JSON.parse(text);
            $log.warn('Worked... saving.');
            storage.set('profile', text, function() {});
          } catch (e) {
            $log.warn('Could not open profile (2nd try):' + e);
          };
        };

      };

      if (!json) return cb('Could not access storage')

      if (!json.iter || !json.ct) {
        $log.debug('Profile is not encrypted');
        return cb(null, text);
      }

      $log.debug('Profile is encrypted');
      getUUID(function(uuid) {
        $log.debug('Device UUID:' + uuid);
        if (!uuid)
          return cb('Could not decrypt storage: could not get device ID');

        try {
          text = sjcl.decrypt(uuid, text);

          $log.info('Migrating to unencrypted profile');
          return storage.set(instanceConfig.walletName + '-profile', text, function(err) {
            return cb(err, text);
          });
        } catch (e) {
          $log.warn('Decrypt error: ', e);
          return cb('Could not decrypt storage: device ID mismatch');
        };
        return cb(null, text);
      });
    };



    root.tryToMigrate = function(cb) {
      if (!shouldUseFileStorage) return cb();

      localStorageService.get('profile', function(err, str) {
        if (err) return cb(err);
        if (!str) return cb();

        $log.info('Starting Migration profile to File storage...');

        fileStorageService.create('profile', str, function(err) {
          if (err) cb(err);
          $log.info('Profile Migrated successfully');

          localStorageService.get('config', function(err, c) {
            if (err) return cb(err);
            if (!c) return root.getProfile(cb);

            fileStorageService.create('config', c, function(err) {

              if (err) {
                $log.info('Error migrating config: ignoring', err);
                return root.getProfile(cb);
              }
              $log.info('Config Migrated successfully');
              return root.getProfile(cb);
            });
          });
        });
      });
    };

    root.storeNewProfile = function(profile, cb) {
      storage.create(instanceConfig.walletName + '-profile', profile.toObj(), cb);
    };

    root.storeProfile = function(profile, cb) {
      storage.set(instanceConfig.walletName + '-profile', profile.toObj(), cb);
    };

    root.getProfile = function(cb) {
      storage.get(instanceConfig.walletName + '-profile', function(err, str) {
        if (err || !str)
          return cb(err);

        decryptOnMobile(str, function(err, str) {
          if (err) return cb(err);
          var p, err;
          try {
            p = Profile.fromString(str);
          } catch (e) {
            $log.debug('Could not read profile:', e);
            err = new Error('Could not read profile:' + p);
          }
          return cb(err, p);
        });
      });
    };

    root.deleteProfile = function(cb) {
      storage.remove(instanceConfig.walletName + '-profile', cb);
    };

    root.storeFocusedWalletId = function(id, cb) {
      storage.set(instanceConfig.walletName + '-focusedWalletId', id || '', cb);
    };

    root.getFocusedWalletId = function(cb) {
      storage.get(instanceConfig.walletName + '-focusedWalletId', cb);
    };

    root.getLastAddress = function(walletId, cb) {
      storage.get(instanceConfig.walletName + '-lastAddress-' + walletId, cb);
    };

    root.storeLastAddress = function(walletId, address, cb) {
      storage.set(instanceConfig.walletName + '-lastAddress-' + walletId, address, cb);
    };

    root.clearLastAddress = function(walletId, cb) {
      storage.remove(instanceConfig.walletName + '-lastAddress-' + walletId, cb);
    };

    root.setBackupFlag = function(walletId, cb) {
      storage.set(instanceConfig.walletName + '-backup-' + walletId, Date.now(), cb);
    };

    root.getBackupFlag = function(walletId, cb) {
      storage.get(instanceConfig.walletName + '-backup-' + walletId, cb);
    };

    root.clearBackupFlag = function(walletId, cb) {
      storage.remove(instanceConfig.walletName + '-backup-' + walletId, cb);
    };

    root.setCleanAndScanAddresses = function(walletId, cb) {
      storage.set(instanceConfig.walletName + '-CleanAndScanAddresses', walletId, cb);
    };

    root.getCleanAndScanAddresses = function(cb) {
      storage.get(instanceConfig.walletName + '-CleanAndScanAddresses', cb);
    };

    root.removeCleanAndScanAddresses = function(cb) {
      storage.remove(instanceConfig.walletName + '-CleanAndScanAddresses', cb);
    };

    root.getConfig = function(cb) {
      storage.get(instanceConfig.walletName + '-config', cb);
    };

    root.storeConfig = function(val, cb) {
      $log.debug('Storing Preferences', val);
      storage.set(instanceConfig.walletName + '-config', val, cb);
    };

    root.clearConfig = function(cb) {
      storage.remove(instanceConfig.walletName + '-config', cb);
    };

    root.setHideBalanceFlag = function(walletId, val, cb) {
      storage.set(instanceConfig.walletName + '-hideBalance-' + walletId, val, cb);
    };

    root.getHideBalanceFlag = function(walletId, cb) {
      storage.get(instanceConfig.walletName + '-hideBalance-' + walletId, cb);
    };

    //for compatibility
    root.getCopayDisclaimerFlag = function(cb) {
      storage.get(instanceConfig.walletName + '-agreeDisclaimer', cb);
    };

    root.setRemotePrefsStoredFlag = function(cb) {
      storage.set(instanceConfig.walletName + '-remotePrefStored', true, cb);
    };

    root.getRemotePrefsStoredFlag = function(cb) {
      storage.get(instanceConfig.walletName + '-remotePrefStored', cb);
    };

    root.setGlideraToken = function(network, token, cb) {
      storage.set(instanceConfig.walletName + '-glideraToken-' + network, token, cb);
    };

    root.getGlideraToken = function(network, cb) {
      storage.get(instanceConfig.walletName + '-glideraToken-' + network, cb);
    };

    root.removeGlideraToken = function(network, cb) {
      storage.remove(instanceConfig.walletName + '-glideraToken-' + network, cb);
    };

    root.setCoinbaseRefreshToken = function(network, token, cb) {
      storage.set(instanceConfig.walletName + '-coinbaseRefreshToken-' + network, token, cb);
    };

    root.getCoinbaseRefreshToken = function(network, cb) {
      storage.get(instanceConfig.walletName + '-coinbaseRefreshToken-' + network, cb);
    };

    root.removeCoinbaseRefreshToken = function(network, cb) {
      storage.remove(instanceConfig.walletName + '-coinbaseRefreshToken-' + network, cb);
    };

    root.setCoinbaseToken = function(network, token, cb) {
      storage.set(instanceConfig.walletName + '-coinbaseToken-' + network, token, cb);
    };

    root.getCoinbaseToken = function(network, cb) {
      storage.get(instanceConfig.walletName + '-coinbaseToken-' + network, cb);
    };

    root.removeCoinbaseToken = function(network, cb) {
      storage.remove(instanceConfig.walletName + '-coinbaseToken-' + network, cb);
    };

    root.setAddressbook = function(network, addressbook, cb) {
      storage.set(instanceConfig.walletName + '-addressbook-' + network, addressbook, cb);
    };

    root.getAddressbook = function(network, cb) {
      storage.get(instanceConfig.walletName + '-addressbook-' + network, cb);
    };

    root.removeAddressbook = function(network, cb) {
      storage.remove(instanceConfig.walletName + '-addressbook-' + network, cb);
    };


    root.checkQuota = function() {
      var block = '';
      // 50MB
      for (var i = 0; i < 1024 * 1024; ++i) {
        block += '12345678901234567890123456789012345678901234567890';
      }
      storage.set('test', block, function(err) {
        $log.error('CheckQuota Return:' + err);
      });
    };

    root.setTxHistory = function(txs, walletId, cb) {
      try {
        storage.set(instanceConfig.walletName + '-txsHistory-' + walletId, txs, cb);
      } catch (e) {
        $log.error('Error saving tx History. Size:' + txs.length);
        $log.error(e);
        return cb(e);
      }
    }

    root.getTxHistory = function(walletId, cb) {
      storage.get(instanceConfig.walletName + '-txsHistory-' + walletId, cb);
    }

    root.removeTxHistory = function(walletId, cb) {
      storage.remove(instanceConfig.walletName + '-txsHistory-' + walletId, cb);
    }

    root.setCoinbaseTxs = function(network, ctx, cb) {
      storage.set(instanceConfig.walletName + '-coinbaseTxs-' + network, ctx, cb);
    };

    root.getCoinbaseTxs = function(network, cb) {
      storage.get(instanceConfig.walletName + '-coinbaseTxs-' + network, cb);
    };

    root.removeCoinbaseTxs = function(network, cb) {
      storage.remove(instanceConfig.walletName + '-coinbaseTxs-' + network, cb);
    };

    root.removeAllWalletData = function(walletId, cb) {
      root.clearLastAddress(walletId, function(err) {
        if (err) return cb(err);
        root.removeTxHistory(walletId, function(err) {
          if (err) return cb(err);
          root.clearBackupFlag(walletId, function(err) {
            return cb(err);
          });
        });
      });
    };

    root.setAmazonGiftCards = function(network, gcs, cb) {
      storage.set(instanceConfig.walletName + '-amazonGiftCards-' + network, gcs, cb);
    };

    root.getAmazonGiftCards = function(network, cb) {
      storage.get(instanceConfig.walletName + '-amazonGiftCards-' + network, cb);
    };

    root.removeAmazonGiftCards = function(network, cb) {
      storage.remove(instanceConfig.walletName + '-amazonGiftCards-' + network, cb);
    };

    root.setCustomAssets = function(customAssets, cb) {
      if (customAssets && !lodash.isString(customAssets)) {
        customAssets = JSON.stringify(customAssets);
      }
      storage.set(instanceConfig.walletName + '-customAssets', customAssets, cb);
    };

    root.getCustomAssets = function(cb) {
      storage.get(instanceConfig.walletName + '-customAssets', function(err, data) {
        if (lodash.isString(data)) {
          data = JSON.parse(data);
        }
        cb(err, data);
      });
    };

    root.removeCustomAssets = function(cb) {
      storage.remove(instanceConfig.walletName + '-customAssets', cb);
    };

    return root;
  });

'use strict';

/*  
 * This is a modification from https://github.com/angular/angular.js/blob/master/src/ngTouch/swipe.js
 */


angular.module('copayApp.services')
  .factory('$swipe', [
  function() {
    // The total distance in any direction before we make the call on swipe vs. scroll.
    var MOVE_BUFFER_RADIUS = 10;

    var POINTER_EVENTS = {
      'touch': {
        start: 'touchstart',
        move: 'touchmove',
        end: 'touchend',
        cancel: 'touchcancel'
      }
    };

    function getCoordinates(event) {
      var originalEvent = event.originalEvent || event;
      var touches = originalEvent.touches && originalEvent.touches.length ? originalEvent.touches : [originalEvent];
      var e = (originalEvent.changedTouches && originalEvent.changedTouches[0]) || touches[0];

      return {
        x: e.clientX,
        y: e.clientY
      };
    }

    function getEvents(pointerTypes, eventType) {
      var res = [];
      angular.forEach(pointerTypes, function(pointerType) {
        var eventName = POINTER_EVENTS[pointerType][eventType];
        if (eventName) {
          res.push(eventName);
        }
      });
      return res.join(' ');
    }

    return {
      /**
       * @ngdoc method
       * @name $swipe#bind
       *
       * @description
       * The main method of `$swipe`. It takes an element to be watched for swipe motions, and an
       * object containing event handlers.
       * The pointer types that should be used can be specified via the optional
       * third argument, which is an array of strings `'mouse'` and `'touch'`. By default,
       * `$swipe` will listen for `mouse` and `touch` events.
       *
       * The four events are `start`, `move`, `end`, and `cancel`. `start`, `move`, and `end`
       * receive as a parameter a coordinates object of the form `{ x: 150, y: 310 }`.
       *
       * `start` is called on either `mousedown` or `touchstart`. After this event, `$swipe` is
       * watching for `touchmove` or `mousemove` events. These events are ignored until the total
       * distance moved in either dimension exceeds a small threshold.
       *
       * Once this threshold is exceeded, either the horizontal or vertical delta is greater.
       * - If the horizontal distance is greater, this is a swipe and `move` and `end` events follow.
       * - If the vertical distance is greater, this is a scroll, and we let the browser take over.
       *   A `cancel` event is sent.
       *
       * `move` is called on `mousemove` and `touchmove` after the above logic has determined that
       * a swipe is in progress.
       *
       * `end` is called when a swipe is successfully completed with a `touchend` or `mouseup`.
       *
       * `cancel` is called either on a `touchcancel` from the browser, or when we begin scrolling
       * as described above.
       *
       */
      bind: function(element, eventHandlers, pointerTypes) {
        // Absolute total movement, used to control swipe vs. scroll.
        var totalX, totalY;
        // Coordinates of the start position.
        var startCoords;
        // Last event's position.
        var lastPos;
        // Whether a swipe is active.
        var active = false;

        pointerTypes = pointerTypes || ['touch'];
        element.on(getEvents(pointerTypes, 'start'), function(event) {
          startCoords = getCoordinates(event);
          active = true;
          totalX = 0;
          totalY = 0;
          lastPos = startCoords;
          eventHandlers['start'] && eventHandlers['start'](startCoords, event);
        });
        var events = getEvents(pointerTypes, 'cancel');
        if (events) {
          element.on(events, function(event) {
            active = false;
            eventHandlers['cancel'] && eventHandlers['cancel'](event);
          });
        }

        element.on(getEvents(pointerTypes, 'move'), function(event) {
          if (!active) return;

          // Android will send a touchcancel if it thinks we're starting to scroll.
          // So when the total distance (+ or - or both) exceeds 10px in either direction,
          // we either:
          // - On totalX > totalY, we send preventDefault() and treat this as a swipe.
          // - On totalY > totalX, we let the browser handle it as a scroll.

          if (!startCoords) return;
          var coords = getCoordinates(event);

          totalX += Math.abs(coords.x - lastPos.x);
          totalY += Math.abs(coords.y - lastPos.y);

          lastPos = coords;

          if (totalX < MOVE_BUFFER_RADIUS && totalY < MOVE_BUFFER_RADIUS) {
            return;
          }

          // One of totalX or totalY has exceeded the buffer, so decide on swipe vs. scroll.
          if (totalY > totalX) {
            // Allow native scrolling to take over.
            active = false;
            eventHandlers['cancel'] && eventHandlers['cancel'](event);
            return;
          } else {

            // Prevent the browser from scrolling.
            event.preventDefault();
            eventHandlers['move'] && eventHandlers['move'](coords, event);
          }
        });

        element.on(getEvents(pointerTypes, 'end'), function(event) {
          if (!active) return;
          active = false;
          eventHandlers['end'] && eventHandlers['end'](getCoordinates(event), event);
        });
      }
    };
  }
]);



'use strict';

angular.module('copayApp.services')
  .factory('trezor', function($log, $timeout, gettext, lodash, bitcore, hwWallet) {
    var root = {};

    var SETTLE_TIME = 3000;
    root.callbacks = {};

    root.getEntropySource = function(isMultisig, account, callback) {
      root.getXPubKey(hwWallet.getEntropyPath('trezor', isMultisig, account), function(data) {
        if (!data.success)
          return callback(hwWallet._err(data));

        return callback(null, hwWallet.pubKeyToEntropySource(data.xpubkey));
      });
    };


    root.getXPubKey = function(path, callback) {
      $log.debug('TREZOR deriving xPub path:', path);
      TrezorConnect.getXPubKey(path, callback);
    };


    root.getInfoForNewWallet = function(isMultisig, account, callback) {
      var opts = {};
      root.getEntropySource(isMultisig, account, function(err, data) {
        if (err) return callback(err);
        opts.entropySource = data;
        $log.debug('Waiting TREZOR to settle...');
        $timeout(function() {

          root.getXPubKey(hwWallet.getAddressPath('trezor', isMultisig, account), function(data) {
            if (!data.success)
              return callback(hwWallet._err(data));

            opts.extendedPublicKey = data.xpubkey;
            opts.externalSource = 'trezor';
            opts.account = account;

            if (isMultisig)
              opts.derivationStrategy = 'BIP48';

            return callback(null, opts);
          });
        }, SETTLE_TIME);
      });
    };

    root._orderPubKeys = function(xPub, np) {
      var xPubKeys = lodash.clone(xPub);
      var path = lodash.clone(np);
      path.unshift('m');
      path = path.join('/');

      var keys = lodash.map(xPubKeys, function(x) {
        var pub = (new bitcore.HDPublicKey(x)).derive(path).publicKey;
        return {
          xpub: x,
          pub: pub.toString('hex'),
        };
      });

      var sorted = lodash.sortBy(keys, function(x) {
        return x.pub;
      });

      return lodash.pluck(sorted, 'xpub');
    };

    root.signTx = function(xPubKeys, txp, account, callback) {

      var inputs = [],
        outputs = [];
      var tmpOutputs = [];


      if (txp.type && txp.type != 'simple') {
        return callback('Only TXPs type SIMPLE are supported in TREZOR');
      } else if (txp.outputs) {
        if (txp.outputs.length > 1)
          return callback('Only single output TXPs are supported in TREZOR');
      } else {
          return callback('Unknown TXP at TREZOR');
      }

      if (txp.outputs) {

        if (!txp.toAddress)
          txp.toAddress = txp.outputs[0].toAddress;

        if (!txp.amount)
          txp.amount = txp.outputs[0].amount;
      }

      if (!txp.toAddress || !txp.amount)
        return callback('No address or amount at TREZOR signing');


      var toScriptType = 'PAYTOADDRESS';
      if (txp.toAddress.charAt(0) == '2' || txp.toAddress.charAt(0) == '3')
        toScriptType = 'PAYTOSCRIPTHASH';


      // Add to
      tmpOutputs.push({
        address: txp.toAddress,
        amount: txp.amount,
        script_type: toScriptType,
      });



      if (txp.addressType == 'P2PKH') {

        $log.debug("Trezor signing uni-sig p2pkh. Account:", account);

        var inAmount = 0;
        inputs = lodash.map(txp.inputs, function(i) {
          $log.debug("Trezor TX input path:", i.path);
          var pathArr = i.path.split('/');
          var n = [hwWallet.UNISIG_ROOTPATH | 0x80000000, 0 | 0x80000000, account | 0x80000000, parseInt(pathArr[1]), parseInt(pathArr[2])];
          inAmount += i.satoshis;
          return {
            address_n: n,
            prev_index: i.vout,
            prev_hash: i.txid,
          };
        });

        var change = inAmount - txp.fee - txp.amount;
        if (change > 0) {
          $log.debug("Trezor TX change path:", txp.changeAddress.path);
          var pathArr = txp.changeAddress.path.split('/');
          var n = [hwWallet.UNISIG_ROOTPATH | 0x80000000, 0 | 0x80000000, account | 0x80000000, parseInt(pathArr[1]), parseInt(pathArr[2])];

          tmpOutputs.push({
            address_n: n,
            amount: change,
            script_type: 'PAYTOADDRESS'
          });
        }

      } else {

        // P2SH Wallet, multisig wallet
        var inAmount = 0;
        $log.debug("Trezor signing multi-sig p2sh. Account:", account);

        var sigs = xPubKeys.map(function(v) {
          return '';
        });


        inputs = lodash.map(txp.inputs, function(i) {
          $log.debug("Trezor TX input path:", i.path);
          var pathArr = i.path.split('/');
          var n = [hwWallet.MULTISIG_ROOTPATH | 0x80000000, 0 | 0x80000000, account | 0x80000000, parseInt(pathArr[1]), parseInt(pathArr[2])];
          var np = n.slice(3);

          inAmount += i.satoshis;

          var orderedPubKeys = root._orderPubKeys(xPubKeys, np);
          var pubkeys = lodash(orderedPubKeys.map(function(v) {
            return {
              node: v,
              address_n: np,
            };
          }));

          return {
            address_n: n,
            prev_index: i.vout,
            prev_hash: i.txid,
            script_type: 'SPENDMULTISIG',
            multisig: {
              pubkeys: pubkeys,
              signatures: sigs,
              m: txp.requiredSignatures,
            }
          };
        });

        var change = inAmount - txp.fee - txp.amount;
        if (change > 0) {
          $log.debug("Trezor TX change path:", txp.changeAddress.path);
          var pathArr = txp.changeAddress.path.split('/');
          var n = [hwWallet.MULTISIG_ROOTPATH | 0x80000000, 0 | 0x80000000, account | 0x80000000, parseInt(pathArr[1]), parseInt(pathArr[2])];
          var np = n.slice(3);

          var orderedPubKeys = root._orderPubKeys(xPubKeys, np);
          var pubkeys = lodash(orderedPubKeys.map(function(v) {
            return {
              node: v,
              address_n: np,
            };
          }));

          tmpOutputs.push({
            address_n: n,
            amount: change,
            script_type: 'PAYTOMULTISIG',
            multisig: {
              pubkeys: pubkeys,
              signatures: sigs,
              m: txp.requiredSignatures,
            }
          });
        }
      }

      // Shuffle outputs for improved privacy
      if (tmpOutputs.length > 1) {
        outputs = new Array(tmpOutputs.length);
        lodash.each(txp.outputOrder, function(order) {
          outputs[order] = tmpOutputs.shift();
        });

        if (tmpOutputs.length)
          return cb("Error creating transaction: tmpOutput order");
      } else {
        outputs = tmpOutputs;
      }

      // Prevents: Uncaught DataCloneError: Failed to execute 'postMessage' on 'Window': An object could not be cloned.
      inputs = JSON.parse(JSON.stringify(inputs));
      outputs = JSON.parse(JSON.stringify(outputs));

      $log.debug('Signing with TREZOR', inputs, outputs);
      TrezorConnect.signTx(inputs, outputs, function(res) {
        if (!res.success)
          return callback(hwWallet._err(res));

        callback(null, res);
      });
    };

    return root;
  });

'use strict';

angular.module('copayApp.services').factory('txFormatService', function(profileService, rateService, configService, lodash) {
  var root = {};

  var formatAmountStr = function(amount) {
    if (!amount) return;
    var config = configService.getSync().wallet.settings;
    return profileService.formatAmount(amount) + ' ' + config.unitName;
  };

  var formatAlternativeStr = function(amount) {
    if (!amount) return;
    var config = configService.getSync().wallet.settings;
    return (rateService.toFiat(amount, config.alternativeIsoCode) ? rateService.toFiat(amount, config.alternativeIsoCode).toFixed(2) : 'N/A') + ' ' + config.alternativeIsoCode;
  };

  var formatFeeStr = function(fee) {
    if (!fee) return;
    var config = configService.getSync().wallet.settings;
    return profileService.formatAmount(fee) + ' ' + config.unitName;
  };

  root.processTx = function(tx) {
    if (!tx || tx.action == 'invalid') 
      return tx; 

    // New transaction output format
    if (tx.outputs && tx.outputs.length) {

      var outputsNr = tx.outputs.length;

      if (tx.action != 'received') {
        if (outputsNr > 1) {
          tx.recipientCount = outputsNr;
          tx.hasMultiplesOutputs = true;
        }
        tx.amount = lodash.reduce(tx.outputs, function(total, o) {
          o.amountStr = formatAmountStr(o.amount);
          o.alternativeAmountStr = formatAlternativeStr(o.amount);
          return total + o.amount;
        }, 0);
      }
      tx.toAddress = tx.outputs[0].toAddress;
    } 

    tx.amountStr = formatAmountStr(tx.amount);
    tx.alternativeAmountStr = formatAlternativeStr(tx.amount);
    tx.feeStr = formatFeeStr(tx.fee || tx.fees);

    return tx;
  };

  return root;
});

'use strict';

angular.module('copayApp.services').factory('txStatus', function(lodash, profileService, $timeout, platformInfo) {
  var root = {};
  var isCordova = platformInfo.isCordova;

  root.notify = function(txp) {
    var fc = profileService.focusedClient;
    var status = txp.status;
    var type;
    var INMEDIATE_SECS = 10;

    if (status == 'broadcasted') {
      type = 'broadcasted';
    } else {

      var n = txp.actions.length;
      var action = lodash.find(txp.actions, {
        copayerId: fc.credentials.copayerId
      });

      if (!action) {
        type = 'created';
      } else if (action.type == 'accept') {
        // created and accepted at the same time?
        if (n == 1 && action.createdOn - txp.createdOn < INMEDIATE_SECS) {
          type = 'created';
        } else {
          type = 'accepted';
        }
      } else if (action.type == 'reject') {
        type = 'rejected';
      } else {
        throw new Error('Unknown type:' + type);
      }
    }
    return type;
  };

  return root;
});

'use strict';
angular.module('copayApp.services')
  .factory('uxLanguage', function languageService($log, lodash, gettextCatalog, amMoment, configService) {
    var root = {};

    root.currentLanguage = null;

    root.availableLanguages = [{
      name: 'English',
      isoCode: 'en',
    }, {
      name: 'Český',
      isoCode: 'cs',
    }, {
      name: 'Français',
      isoCode: 'fr',
    }, {
      name: 'Italiano',
      isoCode: 'it',
    }, {
      name: 'Deutsch',
      isoCode: 'de',
    }, {
      name: 'Español',
      isoCode: 'es',
    }, {
      name: '日本語',
      isoCode: 'ja',
      useIdeograms: true,
    }, {
      name: '中文（简体）',
      isoCode: 'zh',
      useIdeograms: true,
    }, {
      name: 'Polski',
      isoCode: 'pl',
    }, {
      name: 'Pусский',
      isoCode: 'ru',
    }];


    root._detect = function(cb) {

      var userLang, androidLang;
      if (navigator && navigator.globalization) {

        navigator.globalization.getPreferredLanguage(function(preferedLanguage) {
          // works for iOS and Android 4.x
          userLang = preferedLanguage.value;
          userLang = userLang ? (userLang.split('-', 1)[0] || 'en') : 'en';
          // Set only available languages
          userLang = root.isAvailableLanguage(userLang);
          return cb(userLang);
        });
      } else {
        // Auto-detect browser language
        userLang = navigator.userLanguage || navigator.language;
        userLang = userLang ? (userLang.split('-', 1)[0] || 'en') : 'en';
        // Set only available languages
        userLang = root.isAvailableLanguage(userLang);
        return cb(userLang);
      }
    };

    root.isAvailableLanguage = function(userLang) {
      return lodash.find(root.availableLanguages, {
        'isoCode': userLang
      }) ? userLang : 'en';
    };

    root._set = function(lang) {
      $log.debug('Setting default language: ' + lang);
      gettextCatalog.setCurrentLanguage(lang);
      root.currentLanguage = lang; 
      if (lang == 'zh') lang = lang + '-CN'; // Fix for Chinese Simplified
      amMoment.changeLocale(lang);
    };

    root.getCurrentLanguage = function() {
      return root.currentLanguage;
    };

    root.getCurrentLanguageName = function() {
      return root.getName(root.currentLanguage);
    };

    root.getCurrentLanguageInfo = function() {
      return lodash.find(root.availableLanguages, {
        'isoCode': root.currentLanguage
      });
    };

    root.getLanguages = function() {
      return root.availableLanguages;
    };

    root.init = function() {
      root._detect(function(lang) {
        root._set(lang);
      });
    };

    root.update = function(cb) {
      var userLang = configService.getSync().wallet.settings.defaultLanguage;

      if (!userLang) {
        root._detect(function(lang) {
          userLang = lang;

          if (userLang != root.currentLanguage) {
            root._set(lang);
          }
          if (cb) return cb(userLang);
        });
      } else {
        if (userLang != root.currentLanguage) {
          root._set(userLang);
        }

        if (cb) return cb(userLang);
      }
    };

    root.getName = function(lang) {
      return lodash.result(lodash.find(root.availableLanguages, {
        'isoCode': lang
      }), 'name');
    };

    return root;
  });

'use strict';

// DO NOT INCLUDE STORAGE HERE \/ \/
angular.module('copayApp.services').factory('walletService', function($log, lodash, trezor, ledger, configService, uxLanguage) {
// DO NOT INCLUDE STORAGE HERE ^^

  var root = {};

  var _signWithLedger = function(client, txp, cb) {
    $log.info('Requesting Ledger Chrome app to sign the transaction');

    ledger.signTx(txp, client.credentials.account, function(result) {
      $log.debug('Ledger response', result);
      if (!result.success)
        return cb(result.message || result.error);

      txp.signatures = lodash.map(result.signatures, function(s) {
        return s.substring(0, s.length - 2);
      });
      return client.signTxProposal(txp, cb);
    });
  };

  var _signWithTrezor = function(client, txp, cb) {
    $log.info('Requesting Trezor  to sign the transaction');

    var xPubKeys = lodash.pluck(client.credentials.publicKeyRing, 'xPubKey');
    trezor.signTx(xPubKeys, txp, client.credentials.account, function(err, result) {
      if (err) return cb(err);

      $log.debug('Trezor response', result);
      txp.signatures = result.signatures;
      return client.signTxProposal(txp, cb);
    });
  };

  root.needsBackup = function(client) {
    if (client.isPrivKeyExternal()) return false;
    if (!client.credentials.mnemonic) return false;
    if (client.credentials.network == 'testnet') return false;

    return true;
  };


  root.isEncrypted = function(client) {
    if (lodash.isEmpty(client)) return;
    var isEncrypted = client.isPrivKeyEncrypted();
    if (isEncrypted) $log.debug('Wallet is encrypted');
    return isEncrypted;
  };

  root.lock = function(client) {
    try {
      client.lock();
    } catch (e) {
      $log.warn('Encrypting wallet:', e);
    };
  };

  root.unlock = function(client, password) {
    if (lodash.isEmpty(client))
      return 'MISSING_PARAMETER';
    if (lodash.isEmpty(password))
      return 'NO_PASSWORD_GIVEN';
    try {
      client.unlock(password);
    } catch (e) {
      $log.warn('Decrypting wallet:', e);
      return 'PASSWORD_INCORRECT';
    }
  };

  root.createTx = function(client, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(client))
      return cb('MISSING_PARAMETER');

    if (txp.sendMax) {
      client.createTxProposal(txp, function(err, createdTxp) {
        if (err) return cb(err);
        else return cb(null, createdTxp);
      });
    } else {
      client.getFeeLevels(client.credentials.network, function(err, levels) {
        if (err) return cb(err);

        var feeLevelValue = lodash.find(levels, {
          level: txp.feeLevel
        });

        if (!feeLevelValue || !feeLevelValue.feePerKB)
          return cb({
            message: 'Could not get dynamic fee for level: ' + feeLevel
          });

        $log.debug('Dynamic fee: ' + txp.feeLevel + ' ' + feeLevelValue.feePerKB + ' SAT');

        txp.feePerKb = feeLevelValue.feePerKB;
        client.createTxProposal(txp, function(err, createdTxp) {
          if (err) return cb(err);
          else {
            $log.debug('Transaction created');
            return cb(null, createdTxp);
          }
        });
      });
    }
  };

  root.publishTx = function(client, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(client))
      return cb('MISSING_PARAMETER');

    client.publishTxProposal({
      txp: txp
    }, function(err, publishedTx) {
      if (err) return cb(err);
      else {
        $log.debug('Transaction published');
        return cb(null, publishedTx);
      }
    });
  };

  root.signTx = function(client, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(client))
      return cb('MISSING_PARAMETER');

    if (client.isPrivKeyExternal()) {
      switch (client.getPrivKeyExternalSourceName()) {
        case 'ledger':
          return _signWithLedger(client, txp, cb);
        case 'trezor':
          return _signWithTrezor(client, txp, cb);
        default:
          var msg = 'Unsupported External Key:' + client.getPrivKeyExternalSourceName();
          $log.error(msg);
          return cb(msg);
      }
    } else {

      try {
        client.signTxProposal(txp, function(err, signedTxp) {
          $log.debug('Transaction signed');
          return cb(err, signedTxp);
        });
      } catch (e) {
        $log.warn('Error at signTxProposal:', e);
        return cb(e);
      }
    }
  };

  root.broadcastTx = function(client, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(client))
      return cb('MISSING_PARAMETER');

    if (txp.status != 'accepted')
      return cb('TX_NOT_ACCEPTED');

    client.broadcastTxProposal(txp, function(err, broadcastedTxp, memo) {
      if (err)
        return cb(err);

      $log.debug('Transaction broadcasted');
      if (memo) $log.info(memo);

      return cb(null, broadcastedTxp);
    });
  };

  root.rejectTx = function(client, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(client))
      return cb('MISSING_PARAMETER');

    client.rejectTxProposal(txp, null, function(err, rejectedTxp) {
      $log.debug('Transaction rejected');
      return cb(err, rejectedTxp);
    });
  };

  root.removeTx = function(client, txp, cb) {
    if (lodash.isEmpty(txp) || lodash.isEmpty(client))
      return cb('MISSING_PARAMETER');

    client.removeTxProposal(txp, function(err) {
      $log.debug('Transaction removed');
      return cb(err);
    });
  };

  root.updateRemotePreferences = function(clients, prefs, cb) {
    prefs = prefs || {};

    if (!lodash.isArray(clients))
      clients = [clients];

    function updateRemotePreferencesFor(clients, prefs, cb) {
      var client = clients.shift();
      if (!client) return cb();
      $log.debug('Saving remote preferences', client.credentials.walletName, prefs);

      client.savePreferences(prefs, function(err) {
        // we ignore errors here
        if (err) $log.warn(err);

        updateRemotePreferencesFor(clients, prefs, cb);
      });
    };

    // Update this JIC.
    var config = configService.getSync().wallet.settings;

    //prefs.email  (may come from arguments)
    prefs.language = uxLanguage.getCurrentLanguage();
    prefs.unit = config.unitCode;

    updateRemotePreferencesFor(clients, prefs, function(err) {
      if (err) return cb(err);

      lodash.each(clients, function(c) {
        c.preferences = lodash.assign(prefs, c.preferences);
      });
      return cb();
    });
  };

  return root;
});

'use strict';

angular.module('copayApp.controllers').controller('amazonController',
  function($scope, $timeout, $ionicModal, $log, lodash, bwcError, amazonService, platformInfo) {

    if (platformInfo.isCordova && StatusBar.isVisible) {
      StatusBar.backgroundColorByHexString("#4B6178");
    }

    this.init = function() {
      var self = this;
      self.sandbox = amazonService.getEnvironment() == 'testnet' ? true : false;
      amazonService.getPendingGiftCards(function(err, gcds) {
        if (err) {
          self.error = err;
          return;
        }
        $scope.giftCards = lodash.isEmpty(gcds) ? null : gcds;
        $timeout(function() {
          $scope.$digest();
        });
      });
      this.updatePendingGiftCards();
    }

    this.updatePendingGiftCards = lodash.debounce(function() {
      var self = this;

      amazonService.getPendingGiftCards(function(err, gcds) {
        lodash.forEach(gcds, function(dataFromStorage) {
          if (dataFromStorage.status == 'PENDING') {
            $log.debug("creating gift card");
            amazonService.createGiftCard(dataFromStorage, function(err, giftCard) {
              if (err) {
                $log.debug(bwcError.msg(err));
                return;
              }
              if (giftCard.status != 'PENDING') {
                var newData = {};

                lodash.merge(newData, dataFromStorage, giftCard);

                if (newData.status == 'expired') {
                  amazonService.savePendingGiftCard(newData, {
                    remove: true
                  }, function(err) {
                    return;
                  });
                }

                amazonService.savePendingGiftCard(newData, null, function(err) {
                  $log.debug("Saving new gift card");
                  amazonService.getPendingGiftCards(function(err, gcds) {
                    if (err) {
                      self.error = err;
                      return;
                    }
                    $scope.giftCards = gcds;
                    $timeout(function() {
                      $scope.$digest();
                    });
                  });
                });
              } else $log.debug("pending gift card not available yet");
            });
          }
        });
      });

    }, 1000);

    this.openCardModal = function(card) {
      var self = this;
      $scope.card = card;

      $ionicModal.fromTemplateUrl('views/modals/amazon-card-details.html', {
        scope: $scope
      }).then(function(modal) {
        $scope.amazonCardDetailsModal = modal;
        $scope.amazonCardDetailsModal.show();
      });

      $scope.$on('UpdateAmazonList', function(event) {
        self.init();
      });
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('backupController',
  function($rootScope, $scope, $timeout, $log, go, lodash, fingerprintService, platformInfo, configService, profileService, gettext, bwcService, walletService, ongoingProcess) {

    var fc = profileService.focusedClient;
    var prevState;
    $scope.customWords = [];
    $scope.walletName = fc.credentials.walletName;
    $scope.credentialsEncrypted = fc.isPrivKeyEncrypted;

    $scope.init = function(state) {
      prevState = state || 'walletHome';
      $scope.step = 1;
      $scope.deleted = isDeletedSeed();
      if ($scope.deleted) return;

      fingerprintService.check(fc, function(err) {
        if (err) {
          go.path(prevState);
          return;
        }

        handleEncryptedWallet(fc, function(err) {
          if (err) {
            $log.warn('Error decrypting credentials:', $scope.error);
            go.path(prevState);
            return;
          }
          $scope.credentialsEncrypted = false;
          $scope.initFlow();
        });
      });
    };

    function shuffledWords(words) {
      var sort = lodash.sortBy(words);

      return lodash.map(sort, function(w) {
        return {
          word: w,
          selected: false
        };
      });
    };

    $scope.initFlow = function() {
      var words = fc.getMnemonic();
      $scope.xPrivKey = fc.credentials.xPrivKey;
      $scope.mnemonicWords = words.split(/[\u3000\s]+/);
      $scope.shuffledMnemonicWords = shuffledWords($scope.mnemonicWords);
      $scope.mnemonicHasPassphrase = fc.mnemonicHasPassphrase();
      $scope.useIdeograms = words.indexOf("\u3000") >= 0;
      $scope.passphrase = '';
      $scope.customWords = [];
      $scope.step = 1;
      $scope.selectComplete = false;
      $scope.backupError = false;

      $timeout(function() {
        $scope.$apply();
      }, 10);
    };

    function isDeletedSeed() {
      if (lodash.isEmpty(fc.credentials.mnemonic) && lodash.isEmpty(fc.credentials.mnemonicEncrypted))
        return true;
      return false;
    };

    $scope.goBack = function() {
      go.path(prevState || 'walletHome');
    };

    $scope.$on('$destroy', function() {
      walletService.lock(fc);
    });

    $scope.goToStep = function(n) {
      if (n == 1)
        $scope.initFlow();
      if (n == 2)
        $scope.step = 2;
      if (n == 3) {
        if (!$scope.mnemonicHasPassphrase)
          finalStep();
        else
          $scope.step = 3;
      }
      if (n == 4)
        finalStep();

      function finalStep() {
        ongoingProcess.set('validatingWords', true);
        confirm(function(err) {
          ongoingProcess.set('validatingWords', false);
          if (err) {
            backupError(err);
          }
          $timeout(function() {
            $scope.step = 4;
            return;
          }, 1);
        });
      };
    };

    $scope.addButton = function(index, item) {
      var newWord = {
        word: item.word,
        prevIndex: index
      };
      $scope.customWords.push(newWord);
      $scope.shuffledMnemonicWords[index].selected = true;
      $scope.shouldContinue();
    };

    $scope.removeButton = function(index, item) {
      if ($scope.loading) return;
      $scope.customWords.splice(index, 1);
      $scope.shuffledMnemonicWords[item.prevIndex].selected = false;
      $scope.shouldContinue();
    };

    $scope.shouldContinue = function() {
      if ($scope.customWords.length == $scope.shuffledMnemonicWords.length)
        $scope.selectComplete = true;
      else
        $scope.selectComplete = false;
    };

    function confirm(cb) {
      $scope.backupError = false;

      var customWordList = lodash.pluck($scope.customWords, 'word');

      if (!lodash.isEqual($scope.mnemonicWords, customWordList)) {
        return cb('Mnemonic string mismatch');
      }

      $timeout(function() {
        if ($scope.mnemonicHasPassphrase) {
          var walletClient = bwcService.getClient();
          var separator = $scope.useIdeograms ? '\u3000' : ' ';
          var customSentence = customWordList.join(separator);
          var passphrase = $scope.passphrase || '';

          try {
            walletClient.seedFromMnemonic(customSentence, {
              network: fc.credentials.network,
              passphrase: passphrase,
              account: fc.credentials.account
            });
          } catch (err) {
            return cb(err);
          }

          if (walletClient.credentials.xPrivKey != $scope.xPrivKey) {
            return cb('Private key mismatch');
          }
        }

        $rootScope.$emit('Local/BackupDone');
        return cb();
      }, 1);
    };

    function handleEncryptedWallet(client, cb) {
      if (!walletService.isEncrypted(client)) {
        $scope.credentialsEncrypted = false;
        return cb();
      }

      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(client, password));
      });
    };

    function backupError(err) {
      ongoingProcess.set('validatingWords', false);
      $log.debug('Failed to verify backup: ', err);
      $scope.backupError = true;

      $timeout(function() {
        $scope.$apply();
      }, 1);
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('buyAmazonController',
  function($rootScope, $scope, $ionicModal, $log, $timeout, $state, lodash, profileService, bwcError, gettext, configService, walletService, fingerprintService, amazonService, ongoingProcess) {

    var self = this;
    var client;

    var handleEncryptedWallet = function(client, cb) {
      if (!walletService.isEncrypted(client)) return cb();
      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(client, password));
      });
    };

    this.init = function() {
      var network = amazonService.getEnvironment();
      self.allWallets = profileService.getWallets(network, 1);
      client = profileService.focusedClient;

      if (!client) return;

      if (lodash.isEmpty(self.allWallets)) return;

      if (client.credentials.network != network) return;

      $timeout(function() {
        self.selectedWalletId = client.credentials.walletId;
        self.selectedWalletName = client.credentials.walletName;
        $scope.$apply();
      }, 100);
    };

    $scope.openWalletsModal = function(wallets) {
      self.error = null;

      $scope.type = 'GIFT';
      $scope.wallets = wallets;
      $scope.self = self;

      $ionicModal.fromTemplateUrl('views/modals/wallets.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.walletsModal = modal;
        $scope.walletsModal.show();
      });

      $scope.$on('walletSelected', function(ev, walletId) {
        $timeout(function() {
          client = profileService.getClient(walletId);
          self.selectedWalletId = walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
        $scope.walletsModal.hide();
      });
    };

    this.createTx = function() {
      self.error = null;
      self.errorInfo = null;

      var dataSrc = {
        currency: 'USD',
        amount: $scope.fiat,
        uuid: self.selectedWalletId
      };
      var outputs = [];
      var config = configService.getSync();
      var configWallet = config.wallet;
      var walletSettings = configWallet.settings;


      ongoingProcess.set('Processing Transaction...', true);
      $timeout(function() {
        amazonService.createBitPayInvoice(dataSrc, function(err, dataInvoice) {
          if (err) {
            ongoingProcess.set('Processing Transaction...', false);
            self.error = bwcError.msg(err);
            $timeout(function() {
              $scope.$digest();
            });
            return;
          }

          amazonService.getBitPayInvoice(dataInvoice.invoiceId, function(err, invoice) {
            if (err) {
              ongoingProcess.set('Processing Transaction...', false);
              self.error = bwcError.msg(err);
              $timeout(function() {
                $scope.$digest();
              });
              return;
            }

            $log.debug('Fetch PayPro Request...', invoice.paymentUrls.BIP73);

            client.fetchPayPro({
              payProUrl: invoice.paymentUrls.BIP73,
            }, function(err, paypro) {

              if (err) {
                ongoingProcess.set('Processing Transaction...', false);
                $log.warn('Could not fetch payment request:', err);
                var msg = err.toString();
                if (msg.match('HTTP')) {
                  msg = gettext('Could not fetch payment information');
                }
                self.error = msg;
                $timeout(function() {
                  $scope.$digest();
                });
                return;
              }

              if (!paypro.verified) {
                ongoingProcess.set('Processing Transaction...', false);
                $log.warn('Failed to verify payment protocol signatures');
                self.error = gettext('Payment Protocol Invalid');
                $timeout(function() {
                  $scope.$digest();
                });
                return;
              }

              var address, comment, amount, url;

              address = paypro.toAddress;
              amount = paypro.amount;
              url = paypro.url;
              comment = 'Amazon.com Gift Card';

              outputs.push({
                'toAddress': address,
                'amount': amount,
                'message': comment
              });

              var txp = {
                toAddress: address,
                amount: amount,
                outputs: outputs,
                message: comment,
                payProUrl: url,
                excludeUnconfirmedUtxos: configWallet.spendUnconfirmed ? false : true,
                feeLevel: walletSettings.feeLevel || 'normal'
              };

              walletService.createTx(client, txp, function(err, createdTxp) {
                ongoingProcess.set('Processing Transaction...', false);
                if (err) {
                  self.error = bwcError.msg(err);
                  $timeout(function() {
                    $scope.$digest();
                  });
                  return;
                }
                $scope.$emit('Local/NeedsConfirmation', createdTxp, function(accept) {
                  if (accept) {
                    self.confirmTx(createdTxp, function(err, tx) {
                      if (err) {
                        ongoingProcess.set('Processing Transaction...', false);
                        self.error = bwcError.msg(err);
                        $timeout(function() {
                          $scope.$digest();
                        });
                        return;
                      }
                      var count = 0;
                      ongoingProcess.set('Processing Transaction...', true);

                      dataSrc.accessKey = dataInvoice.accessKey;
                      dataSrc.invoiceId = invoice.id;
                      dataSrc.invoiceUrl = invoice.url;
                      dataSrc.invoiceTime = invoice.invoiceTime;

                      self.debounceCreate(count, dataSrc);
                    });
                  }
                });
              });
            });
          });
        });
      }, 100);
    };

    self.debounceCreate = lodash.throttle(function(count, dataSrc) {
      self.debounceCreateGiftCard(count, dataSrc);
    }, 8000, {
      'leading': true
    });

    self.debounceCreateGiftCard = function(count, dataSrc) {

      amazonService.createGiftCard(dataSrc, function(err, giftCard) {
        $log.debug("creating gift card " + count);
        if (err) {
          giftCard = {};
          giftCard.status = 'FAILURE';
          ongoingProcess.set('Processing Transaction...', false);
          self.error = bwcError.msg(err);
          self.errorInfo = dataSrc;
          $timeout(function() {
            $scope.$digest();
          });
        }

        if (giftCard.status == 'PENDING' && count < 3) {
          $log.debug("pending gift card not available yet");
          self.debounceCreate(count + 1, dataSrc, dataSrc);
          return;
        }

        var now = moment().unix() * 1000;

        var newData = giftCard;
        newData['invoiceId'] = dataSrc.invoiceId;
        newData['accessKey'] = dataSrc.accessKey;
        newData['invoiceUrl'] = dataSrc.invoiceUrl;
        newData['amount'] = dataSrc.amount;
        newData['date'] = dataSrc.invoiceTime || now;
        newData['uuid'] = dataSrc.uuid;

        if (newData.status == 'expired') {
          amazonService.savePendingGiftCard(newData, {
            remove: true
          }, function(err) {
            return;
          });
        }

        amazonService.savePendingGiftCard(newData, null, function(err) {
          ongoingProcess.set('Processing Transaction...', false);
          $log.debug("Saving new gift card with status: " + newData.status);

          self.giftCard = newData;
          if (newData.status == 'PENDING') $state.transitionTo('amazon');
          $timeout(function() {
            $scope.$digest();
          });
        });
      });
    }

    this.confirmTx = function(txp, cb) {

      fingerprintService.check(client, function(err) {
        if (err) {
          $log.debug(err);
          return cb(err);
        }

        handleEncryptedWallet(client, function(err) {
          if (err) {
            $log.debug(err);
            return bwcError.cb(err, null, cb);
          }

          ongoingProcess.set('Processing Transaction...', true);
          walletService.publishTx(client, txp, function(err, publishedTxp) {
            if (err) {
              $log.debug(err);
              return bwcError.cb(err, null, cb);
            }

            walletService.signTx(client, publishedTxp, function(err, signedTxp) {
              walletService.lock(client);
              if (err) {
                $log.debug(err);
                walletService.removeTx(client, signedTxp, function(err) {
                  if (err) $log.debug(err);
                });
                return bwcError.cb(err, null, cb);
              }
              walletService.broadcastTx(client, signedTxp, function(err, broadcastedTxp) {
                if (err) {
                  $log.debug(err);
                  walletService.removeTx(client, broadcastedTxp, function(err) {
                    if (err) $log.debug(err);
                  });
                  return bwcError.cb(err, null, cb);
                }
                $timeout(function() {
                  return cb(null, broadcastedTxp);
                }, 5000);
              });
            });
          });
        });
      });
    };

  });

'use strict';

angular.module('copayApp.controllers').controller('buyCoinbaseController',
  function($scope, $log, $ionicModal, $timeout, lodash, profileService, coinbaseService, addressService, ongoingProcess) {
    var self = this;

    this.init = function(testnet) {
      self.allWallets = profileService.getWallets(testnet ? 'testnet' : 'livenet');

      var client = profileService.focusedClient;
      if (client) {
        $timeout(function() {
          self.selectedWalletId = client.credentials.walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
      }
    };

    this.getPaymentMethods = function(token) {
      coinbaseService.getPaymentMethods(token, function(err, p) {
        if (err) {
          self.error = err;
          return;
        }
        self.paymentMethods = [];
        lodash.each(p.data, function(pm) {
          if (pm.allow_buy) {
            self.paymentMethods.push(pm);
          }
          if (pm.allow_buy && pm.primary_buy) {
            $scope.selectedPaymentMethod = pm;
          }
        });
      });
    };

    this.getPrice = function(token) {
      var currency = 'USD';
      coinbaseService.buyPrice(token, currency, function(err, b) {
        if (err) return;
        self.buyPrice = b.data || null;
      });
    };

    $scope.openWalletsModal = function(wallets) {
      self.error = null;

      $scope.type = 'BUY';
      $scope.wallets = wallets;
      $scope.noColor = true;
      $scope.self = self;

      $ionicModal.fromTemplateUrl('views/modals/wallets.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.walletsModal = modal;
        $scope.walletsModal.show();
      });

      $scope.$on('walletSelected', function(ev, walletId) {
        $timeout(function() {
          var client = profileService.getClient(walletId);
          self.selectedWalletId = walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
        $scope.walletsModal.hide();
      });
    };

    this.buyRequest = function(token, account) {
      self.error = null;
      var accountId = account.id;
      var amount = $scope.amount ? $scope.amount : $scope.fiat;
      var currency = $scope.amount ? 'BTC' : 'USD';
      if (!amount) return;
      var dataSrc = {
        amount: amount,
        currency: currency,
        payment_method: $scope.selectedPaymentMethod.id || null
      };
      ongoingProcess.set('Sending request...', true);
      coinbaseService.buyRequest(token, accountId, dataSrc, function(err, data) {
        ongoingProcess.set('Sending request...', false);
        if (err) {
          self.error = err;
          return;
        }
        self.buyInfo = data.data;
      });
    };

    this.confirmBuy = function(token, account, buy) {
      self.error = null;
      var accountId = account.id;
      var buyId = buy.id;
      ongoingProcess.set('Buying Bitcoin...', true);
      coinbaseService.buyCommit(token, accountId, buyId, function(err, b) {
        ongoingProcess.set('Buying Bitcoin...', false);
        if (err) {
          self.error = err;
          return;
        } else {
          var tx = b.data.transaction;
          if (!tx) return;

          ongoingProcess.set('Fetching transaction...', true);
          coinbaseService.getTransaction(token, accountId, tx.id, function(err, updatedTx) {
            ongoingProcess.set('Fetching transaction...', false);
            if (err) $log.debug(err);
            addressService.getAddress(self.selectedWalletId, false, function(err, addr) {
              if (err) {
                self.error = {
                  errors: [{
                    message: 'Could not create address'
                  }]
                };
                return;
              }
              updatedTx.data['toAddr'] = addr;
              coinbaseService.savePendingTransaction(updatedTx.data, {}, function(err) {
                if (err) $log.debug(err);
                if (updatedTx.data.status == 'completed') {
                  self.sendToCopay(token, account, updatedTx.data);
                } else {
                  self.success = updatedTx.data;
                  $timeout(function() {
                    $scope.$emit('Local/CoinbaseTx');
                  }, 1000);
                }
              });
            });
          });
        }
      });
    };

    this.sendToCopay = function(token, account, tx) {
      self.error = null;
      var accountId = account.id;

      ongoingProcess.set('Sending funds to Copay...', true);
      var data = {
        to: tx.toAddr,
        amount: tx.amount.amount,
        currency: tx.amount.currency,
        description: 'Copay Wallet: ' + self.selectedWalletName
      };
      coinbaseService.sendTo(token, accountId, data, function(err, res) {
        ongoingProcess.set('Sending funds to Copay...', false);
        if (err) {
          self.error = err;
        } else {
          self.receiveInfo = res.data;
          if (!res.data.id) return;
          coinbaseService.getTransaction(token, accountId, res.data.id, function(err, sendTx) {
            coinbaseService.savePendingTransaction(tx, {
              remove: true
            }, function(err) {
              coinbaseService.savePendingTransaction(sendTx.data, {}, function(err) {
                $timeout(function() {
                  $scope.$emit('Local/CoinbaseTx');
                }, 1000);
              });
            });
          });
        }

      });
    };


  });

'use strict';

angular.module('copayApp.controllers').controller('buyGlideraController',
  function($scope, $timeout, $ionicModal, profileService, addressService, glideraService, bwcError, lodash, ongoingProcess) {

    var self = this;
    this.show2faCodeInput = null;
    this.error = null;
    this.success = null;

    this.init = function(testnet) {
      self.allWallets = profileService.getWallets(testnet ? 'testnet' : 'livenet');

      var client = profileService.focusedClient;
      if (client) {
        $timeout(function() {
          self.selectedWalletId = client.credentials.walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
      }
    };

    $scope.openWalletsModal = function(wallets) {
      self.error = null;

      $scope.type = 'BUY';
      $scope.wallets = wallets;
      $scope.noColor = true;
      $scope.self = self;

      $ionicModal.fromTemplateUrl('views/modals/wallets.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.walletsModal = modal;
        $scope.walletsModal.show();
      });

      $scope.$on('walletSelected', function(ev, walletId) {
        $timeout(function() {
          var client = profileService.getClient(walletId);
          self.selectedWalletId = walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
        $scope.walletsModal.hide();
      });
    };

    this.getBuyPrice = function(token, price) {
      var self = this;
      this.error = null;
      if (!price || (price && !price.qty && !price.fiat)) {
        this.buyPrice = null;
        return;
      }
      this.gettingBuyPrice = true;
      glideraService.buyPrice(token, price, function(err, buyPrice) {
        self.gettingBuyPrice = false;
        if (err) {
          self.error = 'Could not get exchange information. Please, try again.';
          return;
        }
        self.buyPrice = buyPrice;
      });
    };

    this.get2faCode = function(token) {
      var self = this;
      self.error = null;
      ongoingProcess.set('Sending 2FA code...', true);
      $timeout(function() {
        glideraService.get2faCode(token, function(err, sent) {
          ongoingProcess.set('Sending 2FA code...', false);
          if (err) {
            self.error = 'Could not send confirmation code to your phone';
            return;
          }
          self.show2faCodeInput = sent;
        });
      }, 100);
    };

    this.sendRequest = function(token, permissions, twoFaCode) {
      var self = this;
      self.error = null;
      ongoingProcess.set('Buying Bitcoin...', true);
      $timeout(function() {
        addressService.getAddress(self.selectedWalletId, false, function(err, walletAddr) {
          if (err) {
            ongoingProcess.set('Buying Bitcoin...', false);
            self.error = bwcError.cb(err, 'Could not create address');
            return;
          }
          var data = {
            destinationAddress: walletAddr,
            qty: self.buyPrice.qty,
            priceUuid: self.buyPrice.priceUuid,
            useCurrentPrice: false,
            ip: null
          };
          glideraService.buy(token, twoFaCode, data, function(err, data) {
            ongoingProcess.set('Buying Bitcoin...', false);
            if (err) {
              self.error = err;
              return;
            }
            self.success = data;
            $scope.$emit('Local/GlideraTx');
          });
        });
      }, 100);
    };

  });

'use strict';

angular.module('copayApp.controllers').controller('coinbaseController',
  function($rootScope, $scope, $timeout, $ionicModal, profileService, configService, storageService, coinbaseService, lodash, platformInfo, ongoingProcess) {

    var isNW = platformInfo.isNW;

    if (platformInfo.isCordova && StatusBar.isVisible) {
      StatusBar.backgroundColorByHexString("#4B6178");
    }

    this.openAuthenticateWindow = function() {
      var oauthUrl = this.getAuthenticateUrl();
      if (!isNW) {
        $rootScope.openExternalLink(oauthUrl, '_system');
      } else {
        var self = this;
        var gui = require('nw.gui');
        var win = gui.Window.open(oauthUrl, {
          focus: true,
          position: 'center'
        });
        win.on('loaded', function() {
          var title = win.title;
          if (title.indexOf('Coinbase') == -1) {
            $scope.code = title;
            self.submitOauthCode(title);
            win.close();
          }
        });
      }
    }

    this.getAuthenticateUrl = function() {
      return coinbaseService.getOauthCodeUrl();
    };

    this.submitOauthCode = function(code) {
      var self = this;
      var coinbaseTestnet = configService.getSync().coinbase.testnet;
      var network = coinbaseTestnet ? 'testnet' : 'livenet';
      ongoingProcess.set('connectingCoinbase', true);
      this.error = null;
      $timeout(function() {
        coinbaseService.getToken(code, function(err, data) {
          ongoingProcess.set('connectingCoinbase', false);
          if (err) {
            self.error = err;
            $timeout(function() {
              $scope.$apply();
            }, 100);
          } else if (data && data.access_token && data.refresh_token) {
            storageService.setCoinbaseToken(network, data.access_token, function() {
              storageService.setCoinbaseRefreshToken(network, data.refresh_token, function() {
                $scope.$emit('Local/CoinbaseUpdated', data.access_token);
                $timeout(function() {
                  $scope.$apply();
                }, 100);
              });
            });
          }
        });
      }, 100);
    };

    this.openTxModal = function(tx) {
      $scope.tx = tx;

      $ionicModal.fromTemplateUrl('views/modals/coinbase-tx-details.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.coinbaseTxDetailsModal = modal;
        $scope.coinbaseTxDetailsModal.show();
      });
    };

  });

'use strict';
angular.module('copayApp.controllers').controller('coinbaseUriController',
  function($scope, $stateParams, $timeout, profileService, configService, coinbaseService, storageService, go, ongoingProcess) {

    this.submitOauthCode = function(code) {
      var self = this;
      var coinbaseTestnet = configService.getSync().coinbase.testnet;
      var network = coinbaseTestnet ? 'testnet' : 'livenet';
      ongoingProcess.set('connectingCoinbase', true);
      this.error = null;
      $timeout(function() {
        coinbaseService.getToken(code, function(err, data) {
          ongoingProcess.set('connectingCoinbase', false);
          if (err) {
            self.error = err;
            $timeout(function() {
              $scope.$apply();
            }, 100);
          } else if (data && data.access_token && data.refresh_token) {
            storageService.setCoinbaseToken(network, data.access_token, function() {
              storageService.setCoinbaseRefreshToken(network, data.refresh_token, function() {
                $scope.$emit('Local/CoinbaseUpdated', data.access_token);
                $timeout(function() {
                  go.path('coinbase');
                  $scope.$apply();
                }, 100);
              });
            });
          }
        });
      }, 100);
    };

    this.checkCode = function() {
      if ($stateParams.url) {
        var match = $stateParams.url.match(/code=(.+)&/);
        if (match && match[1]) {
          this.code = match[1];
          return this.submitOauthCode(this.code);
        }
      }
      $log.error('Bad state: ' + JSON.stringify($stateParams));
    }
  });

'use strict';

angular.module('copayApp.controllers').controller('copayersController',
  function($scope, $rootScope, $timeout, $log, $ionicModal, profileService, go, notification, platformInfo, gettext, gettextCatalog) {
    var self = this;
    var isCordova = platformInfo.isCordova;
    var isWP = platformInfo.isWP;
    var isAndroid = platformInfo.isAndroid;

    var delete_msg = gettextCatalog.getString('Are you sure you want to delete this wallet?');
    var accept_msg = gettextCatalog.getString('Accept');
    var cancel_msg = gettextCatalog.getString('Cancel');
    var confirm_msg = gettextCatalog.getString('Confirm');

    // Note that this is ONLY triggered when the page is opened
    // IF a wallet is incomplete and copay is at /#copayers
    // and the user switch to an other complete wallet
    // THIS IS NOT TRIGGERED.
    //
    self.init = function() {
      var fc = profileService.focusedClient;
      if (fc.isComplete()) {
        $log.debug('Wallet Complete...redirecting')
        go.walletHome();
        return;
      }
    };

    var _modalDeleteWallet = function() {
      $scope.title = delete_msg;
      $scope.accept_msg = accept_msg;
      $scope.cancel_msg = cancel_msg;
      $scope.confirm_msg = confirm_msg;
      $scope.okAction = doDeleteWallet;
      $scope.loading = false;

      $ionicModal.fromTemplateUrl('views/modals/confirmation.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.confirmationModal = modal;
        $scope.confirmationModal.show();
      });
    };

    var doDeleteWallet = function() {
      var fc = profileService.focusedClient;
      var walletName = fc.credentials.walletName;
      profileService.deleteWalletClient(fc, function(err) {
        if (err) {
          self.error = err.message || err;
          $timeout(function() {
            $scope.$digest();
          });
        } else {
          go.walletHome();
          $timeout(function() {
            notification.success(
              gettextCatalog.getString('Success'),
              gettextCatalog.getString('The wallet "{{walletName}}" was deleted', {
                walletName: walletName
              })
            );
          });
        }
      });
    };

    self.deleteWallet = function() {
      var fc = profileService.focusedClient;
      if (isCordova) {
        navigator.notification.confirm(
          delete_msg,
          function(buttonIndex) {
            if (buttonIndex == 1) {
              doDeleteWallet();
            }
          },
          confirm_msg, [accept_msg, cancel_msg]
        );
      } else {
        _modalDeleteWallet();
      }
    };

    self.copySecret = function(secret) {
      if (isCordova) {
        window.cordova.plugins.clipboard.copy(secret);
        window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      }
    };

    self.shareSecret = function(secret) {
      if (isCordova) {
        var message = gettextCatalog.getString('Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io', {
          secret: secret
        });
        window.plugins.socialsharing.share(message, gettextCatalog.getString('Invitation to share a Copay Wallet'), null, null);
      }
    };

  });

'use strict';

angular.module('copayApp.controllers').controller('createController',
  function($scope, $rootScope, $timeout, $log, lodash, go, profileService, configService, gettext, ledger, trezor, platformInfo, derivationPathHelper, ongoingProcess) {

    var isChromeApp = platformInfo.isChromeApp;
    var isCordova = platformInfo.isCordova;
    var isDevel = platformInfo.isDevel;

    var self = this;
    var defaults = configService.getDefaults();
    this.isWindowsPhoneApp = platformInfo.isWP && isCordova;
    $scope.account = 1;

    /* For compressed keys, m*73 + n*34 <= 496 */
    var COPAYER_PAIR_LIMITS = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 4,
      6: 4,
      7: 3,
      8: 3,
      9: 2,
      10: 2,
      11: 1,
      12: 1,
    };

    var defaults = configService.getDefaults();
    $scope.bwsurl = defaults.bws.url;
    $scope.derivationPath = derivationPathHelper.default;

    // ng-repeat defined number of times instead of repeating over array?
    this.getNumber = function(num) {
      return new Array(num);
    }

    var updateRCSelect = function(n) {
      $scope.totalCopayers = n;
      var maxReq = COPAYER_PAIR_LIMITS[n];
      self.RCValues = lodash.range(1, maxReq + 1);
      $scope.requiredCopayers = Math.min(parseInt(n / 2 + 1), maxReq);
    };

    var updateSeedSourceSelect = function(n) {

      self.seedOptions = [{
        id: 'new',
        label: gettext('Random'),
      }, {
        id: 'set',
        label: gettext('Specify Recovery Phrase...'),
      }];
      $scope.seedSource = self.seedOptions[0];

      if (n > 1 && isChromeApp)
        self.seedOptions.push({
          id: 'ledger',
          label: 'Ledger Hardware Wallet',
        });

      if (isChromeApp || isDevel) {
        self.seedOptions.push({
          id: 'trezor',
          label: 'Trezor Hardware Wallet',
        });
      }
    };

    this.TCValues = lodash.range(2, defaults.limits.totalCopayers + 1);
    $scope.totalCopayers = defaults.wallet.totalCopayers;

    this.setTotalCopayers = function(tc) {
      updateRCSelect(tc);
      updateSeedSourceSelect(tc);
      self.seedSourceId = $scope.seedSource.id;
    };

    this.setSeedSource = function(src) {
      self.seedSourceId = $scope.seedSource.id;

      $timeout(function() {
        $rootScope.$apply();
      });
    };

    this.create = function(form) {
      if (form && form.$invalid) {
        this.error = gettext('Please enter the required fields');
        return;
      }

      var opts = {
        m: $scope.requiredCopayers,
        n: $scope.totalCopayers,
        name: $scope.walletName,
        myName: $scope.totalCopayers > 1 ? $scope.myName : null,
        networkName: $scope.testnetEnabled ? 'testnet' : 'livenet',
        bwsurl: $scope.bwsurl,
        singleAddress: $scope.singleAddressEnabled,
        walletPrivKey: $scope._walletPrivKey, // Only for testing
      };
      var setSeed = self.seedSourceId == 'set';
      if (setSeed) {

        var words = $scope.privateKey || '';
        if (words.indexOf(' ') == -1 && words.indexOf('prv') == 1 && words.length > 108) {
          opts.extendedPrivateKey = words;
        } else {
          opts.mnemonic = words;
        }
        opts.passphrase = $scope.passphrase;

        var pathData = derivationPathHelper.parse($scope.derivationPath);
        if (!pathData) {
          this.error = gettext('Invalid derivation path');
          return;
        }

        opts.account = pathData.account;
        opts.networkName = pathData.networkName;
        opts.derivationStrategy = pathData.derivationStrategy;

      } else {
        opts.passphrase = $scope.createPassphrase;
      }

      if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
        this.error = gettext('Please enter the wallet recovery phrase');
        return;
      }

      if (self.seedSourceId == 'ledger' || self.seedSourceId == 'trezor') {
        var account = $scope.account;
        if (!account || account < 1) {
          this.error = gettext('Invalid account number');
          return;
        }

        if (self.seedSourceId == 'trezor')
          account = account - 1;

        opts.account = account;
        ongoingProcess.set('connecting' + self.seedSourceId, true);

        var src = self.seedSourceId == 'ledger' ? ledger : trezor;

        src.getInfoForNewWallet(opts.n > 1, account, function(err, lopts) {
          ongoingProcess.set('connecting' + self.seedSourceId, false);
          if (err) {
            self.error = err;
            $scope.$apply();
            return;
          }
          opts = lodash.assign(lopts, opts);
          self._create(opts);
        });
      } else {
        self._create(opts);
      }
    };

    this._create = function(opts) {
      ongoingProcess.set('creatingWallet', true);
      $timeout(function() {

        profileService.createWallet(opts, function(err) {
          ongoingProcess.set('creatingWallet', false);
          if (err) {
            $log.warn(err);
            self.error = err;
            $timeout(function() {
              $rootScope.$apply();
            });
            return;
          }
          if (self.seedSourceId == 'set') {
            $timeout(function() {
              $rootScope.$emit('Local/BackupDone');
            }, 1);
          }
          go.walletHome();

        });
      }, 100);
    }

    this.formFocus = function(what) {
      if (!this.isWindowsPhoneApp) return

      if (what && what == 'my-name') {
        this.hideWalletName = true;
        this.hideTabs = true;
      } else if (what && what == 'wallet-name') {
        this.hideTabs = true;
      } else {
        this.hideWalletName = false;
        this.hideTabs = false;
      }
      $timeout(function() {
        $rootScope.$digest();
      }, 1);
    };

    $scope.$on("$destroy", function() {
      $rootScope.hideWalletNavigation = false;
    });

    updateSeedSourceSelect(1);
    self.setSeedSource();
  });

'use strict';

angular.module('copayApp.controllers').controller('DevLoginController', function($scope, $rootScope, $routeParams, identityService) {

  var mail = $routeParams.mail;
  var password = $routeParams.password;

  var form = {};
  form.email = {};
  form.password = {};
  form.email.$modelValue = mail;
  form.password.$modelValue = password;

  identityService.open($scope, form);

});

'use strict';

angular.module('copayApp.controllers').controller('disclaimerController',
  function($scope, $rootScope, $timeout, $log, $ionicSideMenuDelegate, profileService, applicationService, gettextCatalog, uxLanguage, go, storageService, gettext, platformInfo, ongoingProcess) {
    var self = this;
    self.tries = 0;
    var isCordova = platformInfo.isCordova;

    ongoingProcess.set('creatingWallet', true);

    var create = function(opts) {
      opts = opts || {};
      $log.debug('Creating profile');

      profileService.create(opts, function(err) {
        if (err) {
          $log.warn(err);
          $scope.error = err;
          $scope.$apply();

          return $timeout(function() {
            $log.warn('Retrying to create profile......');
            if (self.tries == 3) {
              self.tries == 0;
              return create({
                noWallet: true
              });
            } else {
              self.tries += 1;
              return create();
            }
          }, 3000);
        };
        $scope.error = "";
        ongoingProcess.set('creatingWallet', false);
      });
    };

    this.init = function(opts) {
      $ionicSideMenuDelegate.canDragContent(false);
      self.lang = uxLanguage.currentLanguage;

      storageService.getProfile(function(err, profile) {
        if (!profile) {
          create(opts);
        } else {
          $log.info('There is already a profile');
          ongoingProcess.set('creatingWallet', false);
          profileService.bindProfile(profile, function(err) {
            if (!err || !err.message || !err.message.match('NONAGREEDDISCLAIMER')) {
              $log.debug('Disclaimer already accepted at #disclaimer. Redirect to Wallet Home.');
              $ionicSideMenuDelegate.canDragContent(true);
              go.walletHome();
            }
          });
        }
      });
    };

    this.accept = function() {
      profileService.setDisclaimerAccepted(function(err) {
        if (err) $log.error(err);
        else {
          $ionicSideMenuDelegate.canDragContent(true);
          $rootScope.$emit('disclaimerAccepted');
          go.walletHome();
        }
      });
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('exportController',
  function($rootScope, $scope, $timeout, $log, lodash, backupService, walletService, fingerprintService, configService, storageService, profileService, platformInfo, notification, go, gettext, gettextCatalog) {
    var prevState;
    var isWP = platformInfo.isWP;
    var isAndroid = platformInfo.isAndroid;
    var fc = profileService.focusedClient;
    $scope.isEncrypted = fc.isPrivKeyEncrypted();
    $scope.isCordova = platformInfo.isCordova;
    $scope.isSafari = platformInfo.isSafari;
    $scope.error = null;

    $scope.init = function(state) {
      $scope.supported = true;
      $scope.exportQR = false;
      $scope.noSignEnabled = false;
      $scope.showAdvanced = false;
      prevState = state || 'walletHome';

      fingerprintService.check(fc, function(err) {
        if (err) {
          go.path(prevState);
          return;
        }

        handleEncryptedWallet(fc, function(err) {
          if (err) {
            go.path(prevState);
            return;
          }

          $scope.exportWalletInfo = encodeWalletInfo();
          $timeout(function() {
            $scope.$apply();
          }, 1);
        });
      });
    };

    /*
      EXPORT WITHOUT PRIVATE KEY - PENDING

    $scope.noSignEnabledChange = function() {
      $scope.exportWalletInfo = encodeWalletInfo();
      $timeout(function() {
        $scope.$apply();
      }, 1);
    };
    */

    $scope.$on('$destroy', function() {
      walletService.lock(fc);
    });

    function handleEncryptedWallet(client, cb) {
      if (!walletService.isEncrypted(client)) {
        $scope.credentialsEncrypted = false;
        return cb();
      }

      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(client, password));
      });
    };

    function encodeWalletInfo() {
      var c = fc.credentials;
      var derivationPath = fc.credentials.getBaseAddressDerivationPath();
      var encodingType = {
        mnemonic: 1,
        xpriv: 2,
        xpub: 3
      };
      var info;

      $scope.supported = (c.derivationStrategy == 'BIP44' && c.canSign());

      if ($scope.supported) {
        if (c.mnemonic) {
          info = {
            type: encodingType.mnemonic,
            data: c.mnemonic,
          }
        } else {
          info = {
            type: encodingType.xpriv,
            data: c.xPrivKey
          }
        }
      } else {
        /*
          EXPORT WITHOUT PRIVATE KEY - PENDING

        info = {
          type: encodingType.xpub,
          data: c.xPubKey
        }
        */

        return null;
      }

      var code = info.type + '|' + info.data + '|' + c.network.toLowerCase() + '|' + derivationPath + '|' + (c.mnemonicHasPassphrase);
      return code;
    };

    $scope.downloadWalletBackup = function() {
      $scope.getAddressbook(function(err, localAddressBook) {
        if (err) {
          $scope.error = true;
          return;
        }
        var opts = {
          noSign: $scope.noSignEnabled,
          addressBook: localAddressBook
        };

        backupService.walletDownload($scope.password, opts, function(err) {
          if (err) {
            $scope.error = true;
            return;
          }
          notification.success(gettext('Success'), gettext('Encrypted export file saved'));
          go.walletHome();
        });
      });
    };

    $scope.getAddressbook = function(cb) {
      storageService.getAddressbook(fc.credentials.network, function(err, addressBook) {
        if (err) return cb(err);

        var localAddressBook = [];
        try {
          localAddressBook = JSON.parse(addressBook);
        } catch (ex) {
          $log.warn(ex);
        }

        return cb(null, localAddressBook);
      });
    };

    $scope.getBackup = function(cb) {
      $scope.getAddressbook(function(err, localAddressBook) {
        if (err) {
          $scope.error = true;
          return cb(null);
        }
        var opts = {
          noSign: $scope.noSignEnabled,
          addressBook: localAddressBook
        };

        var ew = backupService.walletExport($scope.password, opts);
        if (!ew) {
          $scope.error = true;
        } else {
          $scope.error = false;
        }
        return cb(ew);
      });
    };

    $scope.viewWalletBackup = function() {
      $timeout(function() {
        $scope.getBackup(function(backup) {
          var ew = backup;
          if (!ew) return;
          $scope.backupWalletPlainText = ew;
        });
      }, 100);
    };

    $scope.copyWalletBackup = function() {
      $scope.getBackup(function(backup) {
        var ew = backup;
        if (!ew) return;
        window.cordova.plugins.clipboard.copy(ew);
        window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      });
    };

    $scope.sendWalletBackup = function() {
      var fc = profileService.focusedClient;
      window.plugins.toast.showShortCenter(gettextCatalog.getString('Preparing backup...'));
      var name = (fc.credentials.walletName || fc.credentials.walletId);
      if (fc.alias) {
        name = fc.alias + ' [' + name + ']';
      }
      $scope.getBackup(function(backup) {
        var ew = backup;
        if (!ew) return;

        if ($scope.noSignEnabled)
          name = name + '(No Private Key)';

        var subject = 'ColuWallet Wallet Backup: ' + name;
        var body = 'Here is the encrypted backup of the wallet ' + name + ': \n\n' + ew + '\n\n To import this backup, copy all text between {...}, including the symbols {}';
        window.plugins.socialsharing.shareViaEmail(
          body,
          subject,
          null, // TO: must be null or an array
          null, // CC: must be null or an array
          null, // BCC: must be null or an array
          null, // FILES: can be null, a string, or an array
          function() {},
          function() {}
        );
      });
    };

  });

'use strict';

angular.module('copayApp.controllers').controller('glideraController',
  function($rootScope, $scope, $timeout, $ionicModal, profileService, configService, storageService, glideraService, lodash, ongoingProcess, platformInfo) {

    if (platformInfo.isCordova && StatusBar.isVisible) {
      StatusBar.backgroundColorByHexString("#4B6178");
    }

    this.getAuthenticateUrl = function() {
      return glideraService.getOauthCodeUrl();
    };

    this.submitOauthCode = function(code) {
      var self = this;
      var glideraTestnet = configService.getSync().glidera.testnet;
      var network = glideraTestnet ? 'testnet' : 'livenet';
      ongoingProcess.set('connectingGlidera', true);
      this.error = null;
      $timeout(function() {
        glideraService.getToken(code, function(err, data) {
          ongoingProcess.set('connectingGlidera', false);
          if (err) {
            self.error = err;
            $timeout(function() {
              $scope.$apply();
            }, 100);
          } else if (data && data.access_token) {
            storageService.setGlideraToken(network, data.access_token, function() {
              $scope.$emit('Local/GlideraUpdated', data.access_token);
              $timeout(function() {
                $scope.$apply();
              }, 100);
            });
          }
        });
      }, 100);
    };

    this.openTxModal = function(token, tx) {
      var self = this;

      $scope.self = self;
      $scope.tx = tx;

      glideraService.getTransaction(token, tx.transactionUuid, function(error, tx) {
        $scope.tx = tx;
      });

      $ionicModal.fromTemplateUrl('views/modals/glidera-tx-details.html', {
        scope: $scope,
        backdropClickToClose: false,
        hardwareBackButtonClose: false,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.glideraTxDetailsModal = modal;
        $scope.glideraTxDetailsModal.show();
      });
    };

  });

'use strict';
angular.module('copayApp.controllers').controller('glideraUriController',
  function($scope, $log, $stateParams, $timeout, profileService, configService, glideraService, storageService, go, ongoingProcess) {

    this.submitOauthCode = function(code) {
      $log.debug('Glidera Oauth Code:' + code);
      var self = this;
      var glideraTestnet = configService.getSync().glidera.testnet;
      var network = glideraTestnet ? 'testnet' : 'livenet';
      ongoingProcess.set('connectingGlidera', true);
      this.error = null;
      $timeout(function() {
        glideraService.getToken(code, function(err, data) {
          ongoingProcess.set('connectingGlidera', false);
          if (err) {
            self.error = err;
            $timeout(function() {
              $scope.$apply();
            }, 100);
          } else if (data && data.access_token) {
            storageService.setGlideraToken(network, data.access_token, function() {
              $scope.$emit('Local/GlideraUpdated', data.access_token);
              $timeout(function() {
                go.path('glidera');
                $scope.$apply();
              }, 100);
            });
          }
        });
      }, 100);
    };

    this.checkCode = function() {
      if ($stateParams.url) {
        var match = $stateParams.url.match(/code=(.+)/);
        if (match && match[1]) {
          this.code = match[1];
          return this.submitOauthCode(this.code);
        }
      }
      $log.error('Bad state: ' + JSON.stringify($stateParams));
    }
  });

'use strict';

angular.module('copayApp.controllers').controller('importController',
  function($scope, $rootScope, $timeout, $log, profileService, configService, notification, go, sjcl, gettext, ledger, trezor, derivationPathHelper, platformInfo, bwcService, ongoingProcess) {

    var isChromeApp = platformInfo.isChromeApp;
    var isDevel = platformInfo.isDevel;
    var reader = new FileReader();
    var defaults = configService.getDefaults();
    var errors = bwcService.getErrors();
    $scope.bwsurl = defaults.bws.url;
    $scope.derivationPath = derivationPathHelper.default;
    $scope.account = 1;
    $scope.importErr = false;

    var updateSeedSourceSelect = function() {
      $scope.seedOptions = [];

      if (isChromeApp) {
        $scope.seedOptions.push({
          id: 'ledger',
          label: 'Ledger Hardware Wallet',
        });
      }

      if (isChromeApp || isDevel) {
        $scope.seedOptions.push({
          id: 'trezor',
          label: 'Trezor Hardware Wallet',
        });
        $scope.seedSource = $scope.seedOptions[0];
      }
    };

    $scope.processWalletInfo = function(code) {
      if (!code) return;

      $scope.importErr = false;
      $scope.error = null;
      var parsedCode = code.split('|');

      if (parsedCode.length != 5) {
        /// Trying to import a malformed wallet export QR code
        $scope.error = gettext('Incorrect code format');
        return;
      }

      var info = {
        type: parsedCode[0],
        data: parsedCode[1],
        network: parsedCode[2],
        derivationPath: parsedCode[3],
        hasPassphrase: parsedCode[4] == 'true' ? true : false
      };

      if (info.type == 1 && info.hasPassphrase)
        $scope.error = gettext('Password required. Make sure to enter your password in advanced options');

      $scope.derivationPath = info.derivationPath;
      $scope.testnetEnabled = info.network == 'testnet' ? true : false;

      $timeout(function() {
        $scope.words = info.data;
        $rootScope.$apply();
      }, 1);
    };

    $scope.setType = function(type) {
      $scope.type = type;
      $scope.error = null;
      $timeout(function() {
        $rootScope.$apply();
      }, 1);
    };

    var _importBlob = function(str, opts) {
      var str2, err;
      try {
        str2 = sjcl.decrypt($scope.password, str);
      } catch (e) {
        err = gettext('Could not decrypt file, check your password');
        $log.warn(e);
      };

      if (err) {
        $scope.error = err;
        $timeout(function() {
          $rootScope.$apply();
        });
        return;
      }

      ongoingProcess.set('importingWallet', true);
      opts.compressed = null;
      opts.password = null;

      $timeout(function() {
        profileService.importWallet(str2, opts, function(err, walletId) {
          ongoingProcess.set('importingWallet', false);
          if (err) {
            $scope.error = err;
          } else {
            $rootScope.$emit('Local/WalletImported', walletId);
            notification.success(gettext('Success'), gettext('Your wallet has been imported correctly'));
            go.walletHome();
          }
        });
      }, 100);
    };

    var _importExtendedPrivateKey = function(xPrivKey, opts) {
      ongoingProcess.set('importingWallet', true);
      $timeout(function() {
        profileService.importExtendedPrivateKey(xPrivKey, opts, function(err, walletId) {
          ongoingProcess.set('importingWallet', false);
          if (err) {
            if (err instanceof errors.NOT_AUTHORIZED) {
              $scope.importErr = true;
            } else {
              $scope.error = err;
            }
            return $timeout(function() {
              $scope.$apply();
            });
          }

          $rootScope.$emit('Local/WalletImported', walletId);
          notification.success(gettext('Success'), gettext('Your wallet has been imported correctly'));
          go.walletHome();
        });
      }, 100);
    };

    /*
      IMPORT FROM PUBLIC KEY - PENDING

    var _importExtendedPublicKey = function(xPubKey, opts) {
      ongoingProcess.set('importingWallet', true);
      $timeout(function() {
        profileService.importExtendedPublicKey(opts, function(err, walletId) {
          ongoingProcess.set('importingWallet', false);
          if (err) {
            $scope.error = err;
            return $timeout(function() {
              $scope.$apply();
            });
          }
          $rootScope.$emit('Local/WalletImported', walletId);
          notification.success(gettext('Success'), gettext('Your wallet has been imported correctly'));
          go.walletHome();
        });
      }, 100);
    };
    */

    var _importMnemonic = function(words, opts) {
      ongoingProcess.set('importingWallet', true);

      $timeout(function() {
        profileService.importMnemonic(words, opts, function(err, walletId) {
          ongoingProcess.set('importingWallet', false);

          if (err) {
            if (err instanceof errors.NOT_AUTHORIZED) {
              $scope.importErr = true;
            } else {
              $scope.error = err;
            }
            return $timeout(function() {
              $scope.$apply();
            });
          }

          $rootScope.$emit('Local/WalletImported', walletId);
          notification.success(gettext('Success'), gettext('Your wallet has been imported correctly'));
          go.walletHome();
        });
      }, 100);
    };

    $scope.setDerivationPath = function() {
      if ($scope.testnetEnabled)
        $scope.derivationPath = derivationPathHelper.defaultTestnet;
      else
        $scope.derivationPath = derivationPathHelper.default;
    };

    $scope.getFile = function() {
      // If we use onloadend, we need to check the readyState.
      reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
          var opts = {};
          opts.bwsurl = $scope.bwsurl;
          _importBlob(evt.target.result, opts);
        }
      }
    };

    $scope.importBlob = function(form) {
      if (form.$invalid) {
        $scope.error = gettext('There is an error in the form');
        $timeout(function() {
          $scope.$apply();
        });
        return;
      }

      var backupFile = $scope.file;
      var backupText = form.backupText.$modelValue;
      var password = form.password.$modelValue;

      if (!backupFile && !backupText) {
        $scope.error = gettext('Please, select your backup file');
        $timeout(function() {
          $scope.$apply();
        });

        return;
      }

      if (backupFile) {
        reader.readAsBinaryString(backupFile);
      } else {
        var opts = {};
        opts.bwsurl = $scope.bwsurl;
        _importBlob(backupText, opts);
      }
    };

    $scope.importMnemonic = function(form) {
      if (form.$invalid) {
        $scope.error = gettext('There is an error in the form');
        $timeout(function() {
          $scope.$apply();
        });
        return;
      }

      var opts = {};
      if ($scope.bwsurl)
        opts.bwsurl = $scope.bwsurl;

      var pathData = derivationPathHelper.parse($scope.derivationPath);
      if (!pathData) {
        $scope.error = gettext('Invalid derivation path');
        return;
      }
      opts.account = pathData.account;
      opts.networkName = pathData.networkName;
      opts.derivationStrategy = pathData.derivationStrategy;

      var words = form.words.$modelValue || null;
      $scope.error = null;

      if (!words) {
        $scope.error = gettext('Please enter the recovery phrase');
      } else if (words.indexOf('xprv') == 0 || words.indexOf('tprv') == 0) {
        return _importExtendedPrivateKey(words, opts);
      } else if (words.indexOf('xpub') == 0 || words.indexOf('tpuv') == 0) {
        return _importExtendedPublicKey(words, opts);
      } else {
        var wordList = words.split(/[\u3000\s]+/);

        if ((wordList.length % 3) != 0) {
          $scope.error = gettext('Wrong number of recovery words:') + wordList.length;
        }
      }

      if ($scope.error) {
        $timeout(function() {
          $scope.$apply();
        });
        return;
      }

      var passphrase = form.passphrase.$modelValue;
      opts.passphrase = form.passphrase.$modelValue || null;

      _importMnemonic(words, opts);
    };

    $scope.importTrezor = function(account, isMultisig) {
      trezor.getInfoForNewWallet(isMultisig, account, function(err, lopts) {
        ongoingProcess.clear();
        if (err) {
          $scope.error = err;
          $scope.$apply();
          return;
        }

        lopts.externalSource = 'trezor';
        lopts.bwsurl = $scope.bwsurl;
        ongoingProcess.set('importingWallet', true);
        $log.debug('Import opts', lopts);

        profileService.importExtendedPublicKey(lopts, function(err, walletId) {
          ongoingProcess.set('importingWallet', false);
          if (err) {
            $scope.error = err;
            return $timeout(function() {
              $scope.$apply();
            });
          }
          $rootScope.$emit('Local/WalletImported', walletId);
          notification.success(gettext('Success'), gettext('Your wallet has been imported correctly'));
          go.walletHome();
        });
      }, 100);
    };

    $scope.importHW = function(form) {
      if (form.$invalid || $scope.account < 0) {
        $scope.error = gettext('There is an error in the form');
        $timeout(function() {
          $scope.$apply();
        });
        return;
      }
      $scope.error = '';
      $scope.importErr = false;

      var account = +$scope.account;

      if ($scope.seedSourceId == 'trezor') {
        if (account < 1) {
          $scope.error = gettext('Invalid account number');
          return;
        }
        account = account - 1;
      }

      switch ($scope.seedSourceId) {
        case ('ledger'):
          ongoingProcess.set('connectingledger', true);
          $scope.importLedger(account);
          break;
        case ('trezor'):
          ongoingProcess.set('connectingtrezor', true);
          $scope.importTrezor(account, $scope.isMultisig);
          break;
        default:
          throw ('Error: bad source id');
      };
    };

    $scope.setSeedSource = function() {

      if (!$scope.seedSource) return;
      $scope.seedSourceId = $scope.seedSource.id;
      $timeout(function() {
        $rootScope.$apply();
      });
    };

    $scope.importLedger = function(account) {
      ledger.getInfoForNewWallet(true, account, function(err, lopts) {
        ongoingProcess.clear();
        if (err) {
          $scope.error = err;
          $scope.$apply();
          return;
        }

        lopts.externalSource = 'ledger';
        lopts.bwsurl = $scope.bwsurl;
        ongoingProcess.set('importingWallet', true);
        $log.debug('Import opts', lopts);

        profileService.importExtendedPublicKey(lopts, function(err, walletId) {
          ongoingProcess.set('importingWallet', false);
          if (err) {
            $scope.error = err;
            return $timeout(function() {
              $scope.$apply();
            });
          }
          $rootScope.$emit('Local/WalletImported', walletId);
          notification.success(gettext('Success'), gettext('Your wallet has been imported correctly'));
          go.walletHome();
        });
      }, 100);
    };

    updateSeedSourceSelect();
    $scope.setSeedSource('new');
  });

'use strict';

angular.module('copayApp.controllers').controller('indexController', function($rootScope, $scope, $log, $filter, $timeout, $ionicScrollDelegate, $ionicPopup, $ionicSideMenuDelegate, $httpBackend, latestReleaseService, feeService, bwcService, pushNotificationsService, lodash, go, profileService, configService, rateService, storageService, addressService, gettext, gettextCatalog, amMoment, addonManager, bwcError, txFormatService, uxLanguage, glideraService, coinbaseService, platformInfo, addressbookService, openURLService, ongoingProcess, coloredCoins, assetService, $q, instanceConfig) {

  var self = this;
  var SOFT_CONFIRMATION_LIMIT = 12;
  var errors = bwcService.getErrors();
  var historyUpdateInProgress = {};
  var isChromeApp = platformInfo.isChromeApp;
  var isCordova = platformInfo.isCordova;
  var isNW = platformInfo.isNW;

  var ret = {};
  ret.isCordova = isCordova;
  ret.isChromeApp = isChromeApp;
  ret.isSafari = platformInfo.isSafari;
  ret.isWindowsPhoneApp = platformInfo.isWP;
  ret.historyShowLimit = 10;
  ret.historyShowMoreLimit = 10;
  ret.isSearching = false;
  ret.prevState = 'walletHome';
  ret.physicalScreenWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width);

  // Only for testing
  //storageService.checkQuota();

  ret.instanceName = instanceConfig.walletName;
  ret.secondaryColor = instanceConfig.secondaryColor || '#2C3E50';
  ret.allowAssetChange = instanceConfig.allowAssetChange || false;
  ret.noUserColors = instanceConfig.noUserColors;

  ret.menu = [{
    'title': gettext('Receive'),
    'icon': {
      false: 'icon-receive',
      true: 'icon-receive-active'
    },
    'link': 'receive'
  }, {
    'title': gettext('Activity'),
    'icon': {
      false: 'icon-activity',
      true: 'icon-activity-active'
    },
    'link': 'walletHome'
  }, {
    'title': gettext('Send'),
    'icon': {
      false: 'icon-send',
      true: 'icon-send-active'
    },
    'link': 'send'
  }];

  ret.addonViews = addonManager.addonViews();
  ret.txTemplateUrl = addonManager.txTemplateUrl() || 'views/includes/transaction.html';

  ret.tab = 'walletHome';
  var vanillaScope = ret;

  if (isNW) {
    latestReleaseService.checkLatestRelease(function(err, newRelease) {
      if (err) {
        $log.warn(err);
        return;
      }

      if (newRelease)
        $scope.newRelease = gettext('There is a new version of Copay. Please update');
    });
  }

  function strip(number) {
    return (parseFloat(number.toPrecision(12)));
  };

  self.goHome = function() {
    go.walletHome();
  };

  self.allowRefresher = function() {
    if ($ionicSideMenuDelegate.getOpenRatio() != 0) self.allowPullToRefresh = false;
  }

  self.hideBalance = function() {
    storageService.getHideBalanceFlag(self.walletId, function(err, shouldHideBalance) {
      if (err) self.shouldHideBalance = false;
      else self.shouldHideBalance = (shouldHideBalance == 'true') ? true : false;
    });
  }

  self.onHold = function() {
    self.shouldHideBalance = !self.shouldHideBalance;
    storageService.setHideBalanceFlag(self.walletId, self.shouldHideBalance.toString(), function() {});
  }

  self.setWalletPreferencesTitle = function() {
    return gettext("Wallet Preferences");
  }

  var disableOngoingProcessListener = $rootScope.$on('Addon/OngoingProcess', function(e, name) {
    self.updating = !!name;
    self.ongoingProcess = name;
  });

  $scope.$on('$destroy', function() {
    disableOngoingProcessListener();
  });

  self.openWalletInfo = function() {
    if (self.allowAssetChange) {
        go.path('walletInfo');
    }
  };

  self.cleanInstance = function() {
    $log.debug('Cleaning Index Instance');
    lodash.each(self, function(v, k) {
      if (lodash.isFunction(v)) return;
      // This are to prevent flicker in mobile:
      if (k == 'hasProfile') return;
      if (k == 'tab') return;
      if (k == 'noFocusedWallet') return;
      if (k == 'backgroundColor') return;
      if (k == 'physicalScreenWidth') return;
      if (k == 'loadingWallet') {
        self.loadingWallet = true;
        return;
      }
      if (!lodash.isUndefined(vanillaScope[k])) {
        self[k] = vanillaScope[k];
        return;
      }

      delete self[k];
    });
  };

  self.setFocusedWallet = function() {
    var fc = profileService.focusedClient;
    if (!fc) return;

    self.cleanInstance();
    self.loadingWallet = true;
    self.setSpendUnconfirmed();

    $timeout(function() {
      $rootScope.$apply();

      self.hasProfile = true;
      self.isSingleAddress = false;
      self.noFocusedWallet = false;
      self.updating = false;

      // Credentials Shortcuts
      self.m = fc.credentials.m;
      self.n = fc.credentials.n;
      self.network = fc.credentials.network;
      self.copayerId = fc.credentials.copayerId;
      self.copayerName = fc.credentials.copayerName;
      self.requiresMultipleSignatures = fc.credentials.m > 1;
      self.isShared = fc.credentials.n > 1;
      self.walletName = fc.credentials.walletName;
      self.walletId = fc.credentials.walletId;
      self.isComplete = fc.isComplete();
      self.canSign = fc.canSign();
      self.isPrivKeyExternal = fc.isPrivKeyExternal();
      self.isPrivKeyEncrypted = fc.isPrivKeyEncrypted();
      self.externalSource = fc.getPrivKeyExternalSourceName();
      self.account = fc.credentials.account;
      self.incorrectDerivation = fc.keyDerivationOk === false;

      if (self.externalSource == 'trezor')
        self.account++;

      self.txps = [];
      self.copayers = [];
      self.updateColor();
      self.updateAlias();
      self.setAddressbook();

      self.initGlidera();
      self.initCoinbase();

      self.hideBalance();

      self.setCustomBWSFlag();

      if (!self.isComplete) {
        $log.debug('Wallet not complete BEFORE update... redirecting');
        go.path('copayers');
      } else {
        if (go.is('copayers')) {
          $log.debug('Wallet Complete BEFORE update... redirect to home');
          go.walletHome();
        }
      }

      profileService.needsBackup(fc, function(needsBackup) {
        self.needsBackup = needsBackup && instanceConfig.needsBackup;
        self.openWallet(function() {
          if (!self.isComplete) {
            $log.debug('Wallet not complete after update... redirecting');
            go.path('copayers');
          } else {
            if (go.is('copayers')) {
              $log.debug('Wallet Complete after update... redirect to home');
              go.walletHome();
            }
          }
        });
      });
    });
  };

  self.setCustomBWSFlag = function() {
    var defaults = configService.getDefaults();
    var config = configService.getSync();

    self.usingCustomBWS = config.bwsFor && config.bwsFor[self.walletId] && (config.bwsFor[self.walletId] != defaults.bws.url);
  };


  self.setTab = function(tab, reset, tries, switchState) {
    tries = tries || 0;

    // check if the whole menu item passed
    if (typeof tab == 'object') {
      if (tab.open) {
        if (tab.link) {
          self.tab = tab.link;
        }
        tab.open();
        return;
      } else {
        return self.setTab(tab.link, reset, tries, switchState);
      }
    }
    if (self.tab === tab && !reset)
      return;

    if (!document.getElementById('menu-' + tab) && ++tries < 5) {
      return $timeout(function() {
        self.setTab(tab, reset, tries, switchState);
      }, 300);
    }

    if (!self.tab || !go.is('walletHome'))
      self.tab = 'walletHome';

    var changeTab = function() {
      if (document.getElementById(self.tab)) {
        document.getElementById(self.tab).className = 'tab-out tab-view ' + self.tab;
        var old = document.getElementById('menu-' + self.tab);
        if (old) {
          old.className = '';
        }
      }

      if (document.getElementById(tab)) {
        document.getElementById(tab).className = 'tab-in  tab-view ' + tab;
        var newe = document.getElementById('menu-' + tab);
        if (newe) {
          newe.className = 'active';
        }
      }

      self.tab = tab;
      $rootScope.$emit('Local/TabChanged', tab);
    };

    if (switchState && !go.is('walletHome')) {
      go.path('walletHome', function() {
        changeTab();
      });
      return;
    }

    changeTab();
  };



  var _walletStatusHash = function(walletStatus) {
    var bal;
    if (walletStatus) {
      bal = walletStatus.balance.totalAmount;
    } else {
      bal = self.totalBalanceSat;
    }
    return bal;
  };

  // TODO move this to wallet service
  self.updateAll = function(opts, initStatusHash, tries) {
    $scope.$broadcast('scroll.refreshComplete');
    tries = tries || 0;
    opts = opts || {};
    var fc = profileService.focusedClient;
    if (!fc) return;

    var walletId = fc.credentials.walletId

    if (opts.untilItChanges && lodash.isUndefined(initStatusHash)) {
      initStatusHash = _walletStatusHash();
      $log.debug('Updating status until it changes. initStatusHash:' + initStatusHash)
    }

    var get = function(cb) {
      if (opts.walletStatus)
        return cb(null, opts.walletStatus);
      else {
        self.updateError = false;
        return fc.getStatus({
          twoStep: true
        }, function(err, ret) {
          if (err) {
            self.updateError = bwcError.msg(err, gettext('Could not update Wallet'));
          } else {
            self.isSingleAddress = !!ret.wallet.singleAddress;
            if (!opts.quiet)
              self.updating = ret.wallet.scanStatus == 'running';
          }
          return cb(err, ret);
        });
      }
    };

    // If not untilItChanges...trigger history update now
    if (opts.triggerTxUpdate && !opts.untilItChanges) {
      $timeout(function() {
        self.debounceUpdateHistory();
      }, 1);
    }

    $timeout(function() {

      if (!opts.quiet)
        self.updating = true;

      $log.debug('Updating Status:', fc.credentials.walletName, tries);
      self.asset = {};
      get(function(err, walletStatus) {
        var currentStatusHash = _walletStatusHash(walletStatus);
        $log.debug('Status update. hash:' + currentStatusHash + ' Try:' + tries);
        if (!err && opts.untilItChanges && initStatusHash == currentStatusHash && tries < 7 && walletId == profileService.focusedClient.credentials.walletId) {
          return $timeout(function() {
            $log.debug('Retrying update... Try:' + tries)
            return self.updateAll({
              walletStatus: null,
              untilItChanges: true,
              triggerTxUpdate: opts.triggerTxUpdate,
            }, initStatusHash, ++tries);
          }, 1400 * tries);
        }

        if (walletId != profileService.focusedClient.credentials.walletId)
          return;

        self.updating = false;

        if (err) {
          self.handleError(err);
          return;
        }
        $log.debug('Wallet Status:', walletStatus);
        self.setPendingTxps(walletStatus.pendingTxps);

        // Status Shortcuts
        self.lastUpdate = Date.now();
        self.walletName = walletStatus.wallet.name;
        self.walletSecret = walletStatus.wallet.secret;
        self.walletStatus = walletStatus.wallet.status;
        self.walletScanStatus = walletStatus.wallet.scanStatus;
        self.copayers = walletStatus.wallet.copayers;
        self.preferences = walletStatus.preferences;
        self.setBalance(walletStatus.balance);
        self.otherWallets = lodash.filter(profileService.getWallets(self.network), function(w) {
          return w.id != self.walletId;
        });
        $rootScope.$on('Local/WalletAssetUpdated', function() {
          self.asset = assetService.walletAsset;
          updateAndFilterHistory();
          updateAndFilterProposals();
        });

        // Notify external addons or plugins
        $rootScope.$emit('Local/BalanceUpdated', walletStatus.balance);
        $rootScope.$apply();


        if (opts.triggerTxUpdate && opts.untilItChanges) {
          $timeout(function() {
            self.debounceUpdateHistory();
          }, 1);
        } else {
          self.loadingWallet = false;
        }

        if (opts.cb) return opts.cb();
      });
    });
  };

  self.setSpendUnconfirmed = function(spendUnconfirmed) {
    self.spendUnconfirmed = spendUnconfirmed || configService.getSync().wallet.spendUnconfirmed;
  };

  self.updateBalance = function() {
    var fc = profileService.focusedClient;
    $timeout(function() {
      ongoingProcess.set('updatingBalance', true);
      $log.debug('Updating Balance');
      fc.getBalance(function(err, balance) {
        ongoingProcess.set('updatingBalance', false);
        if (err) {
          self.handleError(err);
          return;
        }
        $log.debug('Wallet Balance:', balance);
        self.setBalance(balance);
      });
    });
  };

  self.updatePendingTxps = function() {
    var fc = profileService.focusedClient;
    $timeout(function() {
      self.updating = true;
      $log.debug('Updating PendingTxps');
      fc.getTxProposals({}, function(err, txps) {
        self.updating = false;
        if (err) {
          self.handleError(err);
        } else {
          $log.debug('Wallet PendingTxps:', txps);
          self.setPendingTxps(txps);
        }
        $rootScope.$apply();
      });
    });
  };

  // This handles errors from BWS/index which normally
  // trigger from async events (like updates).
  // Debounce function avoids multiple popups
  var _handleError = function(err) {
    $log.warn('Client ERROR: ', err);
    if (err instanceof errors.NOT_AUTHORIZED) {
      self.notAuthorized = true;
      go.walletHome();
    } else if (err instanceof errors.NOT_FOUND) {
      self.showErrorPopup(gettext('Could not access Wallet Service: Not found'));
    } else {
      var msg = ""
      $scope.$emit('Local/ClientError', (err.error ? err.error : err));
      var msg = bwcError.msg(err, gettext('Error at Wallet Service'));
      self.showErrorPopup(msg);
    }
  };

  self.handleError = lodash.debounce(_handleError, 1000);

  self.openWallet = function(cb) {
    var fc = profileService.focusedClient;
    $timeout(function() {
      $rootScope.$apply();
      self.updating = true;
      self.updateError = false;
      fc.openWallet(function(err, walletStatus) {
        self.updating = false;
        if (err) {
          self.updateError = true;
          self.handleError(err);
          return;
        }
        $log.debug('Wallet Opened');

        self.updateAll(lodash.isObject(walletStatus) ? {
          walletStatus: walletStatus,
          cb: cb,
        } : {
          cb: cb
        });
        $rootScope.$apply();
      });
    });
  };

  self.setPendingTxps = function(txps) {
    self.pendingTxProposalsCountForUs = 0;
    var now = Math.floor(Date.now() / 1000);

    /* Uncomment to test multiple outputs */
    /*
    var txp = {
      message: 'test multi-output',
      fee: 1000,
      createdOn: new Date() / 1000,
      outputs: []
    };
    function addOutput(n) {
      txp.outputs.push({
        amount: 600,
        toAddress: '2N8bhEwbKtMvR2jqMRcTCQqzHP6zXGToXcK',
        message: 'output #' + (Number(n) + 1)
      });
    };
    lodash.times(150, addOutput);
    txps.push(txp);
    */

    lodash.each(txps, function(tx) {

      tx = txFormatService.processTx(tx);

      // no future transactions...
      if (tx.createdOn > now)
        tx.createdOn = now;

      var action = lodash.find(tx.actions, {
        copayerId: self.copayerId
      });

      if (!action && tx.status == 'pending') {
        tx.pendingForUs = true;
      }

      if (action && action.type == 'accept') {
        tx.statusForUs = 'accepted';
      } else if (action && action.type == 'reject') {
        tx.statusForUs = 'rejected';
      } else {
        tx.statusForUs = 'pending';
      }

      if (!tx.deleteLockTime)
        tx.canBeRemoved = true;

      if (tx.creatorId != self.copayerId) {
        self.pendingTxProposalsCountForUs = self.pendingTxProposalsCountForUs + 1;
      }
    });
    self.allTxps = txps;
    updateAndFilterProposals();
  };

  var SAFE_CONFIRMATIONS = 6;

  self.processNewTxs = function(txs) {
    var config = configService.getSync().wallet.settings;
    var now = Math.floor(Date.now() / 1000);
    var txHistoryUnique = {};
    var ret = [];
    self.hasUnsafeConfirmed = false;

    lodash.each(txs, function(tx) {
      tx = txFormatService.processTx(tx);

      // no future transactions...
      if (tx.time > now)
        tx.time = now;

      if (tx.confirmations >= SAFE_CONFIRMATIONS) {
        tx.safeConfirmed = SAFE_CONFIRMATIONS + '+';
      } else {
        tx.safeConfirmed = false;
        self.hasUnsafeConfirmed = true;
      }

      if (tx.note) {
        delete tx.note.encryptedEditedByName;
        delete tx.note.encryptedBody;
      }

      if (!txHistoryUnique[tx.txid]) {
        ret.push(tx);
        txHistoryUnique[tx.txid] = true;
      } else {
        $log.debug('Ignoring duplicate TX in history: ' + tx.txid)
      }
    });

    return ret;
  };

  self.updateAlias = function() {
    var config = configService.getSync();
    config.aliasFor = config.aliasFor || {};
    self.alias = config.aliasFor[self.walletId];
    var fc = profileService.focusedClient;
    fc.alias = self.alias;
  };

  self.updateColor = function() {
    var config = configService.getSync();
    config.colorFor = config.colorFor || {};
    self.backgroundColor = instanceConfig.mainColor || '#4A90E2';
    if (!instanceConfig.noUserColors) {
      self.backgroundColor = config.colorFor[self.walletId] || self.backgroundColor;
    };
    var fc = profileService.focusedClient;
    fc.backgroundColor = self.backgroundColor;
    if (isCordova && StatusBar.isVisible) {
      StatusBar.backgroundColorByHexString(fc.backgroundColor);
    }
  };

  self.setBalance = function(balance) {
    if (!balance) return;
    var config = configService.getSync().wallet.settings;
    var COIN = 1e8;


    // Address with Balance
    self.balanceByAddress = balance.byAddress;

    // Spend unconfirmed funds
    if (self.spendUnconfirmed) {
      self.totalBalanceSat = balance.totalAmount;
      self.lockedBalanceSat = balance.lockedAmount;
      self.availableBalanceSat = balance.availableAmount;
      self.totalBytesToSendMax = balance.totalBytesToSendMax;
      self.pendingAmount = null;
    } else {
      self.totalBalanceSat = balance.totalConfirmedAmount;
      self.lockedBalanceSat = balance.lockedConfirmedAmount;
      self.availableBalanceSat = balance.availableConfirmedAmount;
      self.totalBytesToSendMax = balance.totalBytesToSendConfirmedMax;
      self.pendingAmount = balance.totalAmount - balance.totalConfirmedAmount;
    }

    // Selected unit
    self.unitToSatoshi = config.unitToSatoshi;
    self.satToUnit = 1 / self.unitToSatoshi;
    self.unitName = config.unitName;

    //STR
    self.totalBalanceStr = profileService.formatAmount(self.totalBalanceSat) + ' ' + self.unitName;
    self.lockedBalanceStr = profileService.formatAmount(self.lockedBalanceSat) + ' ' + self.unitName;
    self.availableBalanceStr = profileService.formatAmount(self.availableBalanceSat) + ' ' + self.unitName;

    assetService.setBtcBalance(self.totalBalanceStr);

    if (self.pendingAmount) {
      self.pendingAmountStr = profileService.formatAmount(self.pendingAmount) + ' ' + self.unitName;
    } else {
      self.pendingAmountStr = null;
    }

    self.alternativeName = config.alternativeName;
    self.alternativeIsoCode = config.alternativeIsoCode;

    // Check address
    addressService.isUsed(self.walletId, balance.byAddress, function(err, used) {
      if (used) {
        $log.debug('Address used. Creating new');
        $rootScope.$emit('Local/AddressIsUsed');
      }
    });

    rateService.whenAvailable(function() {

      var totalBalanceAlternative = rateService.toFiat(self.totalBalanceSat, self.alternativeIsoCode);
      var lockedBalanceAlternative = rateService.toFiat(self.lockedBalanceSat, self.alternativeIsoCode);
      var alternativeConversionRate = rateService.toFiat(100000000, self.alternativeIsoCode);

      self.totalBalanceAlternative = $filter('formatFiatAmount')(totalBalanceAlternative);
      self.lockedBalanceAlternative = $filter('formatFiatAmount')(lockedBalanceAlternative);
      self.alternativeConversionRate = $filter('formatFiatAmount')(alternativeConversionRate);

      self.alternativeBalanceAvailable = true;

      self.isRateAvailable = true;
      $rootScope.$apply();
    });

    if (!rateService.isAvailable()) {
      $rootScope.$apply();
    }
  };

  self.removeAndMarkSoftConfirmedTx = function(txs) {
    return lodash.filter(txs, function(tx) {
      if (tx.confirmations >= SOFT_CONFIRMATION_LIMIT)
        return tx;
      tx.recent = true;
    });
  }

  self.getSavedTxs = function(walletId, cb) {

    storageService.getTxHistory(walletId, function(err, txs) {
      if (err) return cb(err);

      var localTxs = [];

      if (!txs) {
        return cb(null, localTxs);
      }

      try {
        localTxs = JSON.parse(txs);
      } catch (ex) {
        $log.warn(ex);
      }
      return cb(null, lodash.compact(localTxs));
    });
  }

  self.updateLocalTxHistory = function(client, cb) {
    var FIRST_LIMIT = 5;
    var LIMIT = 50;
    var requestLimit = FIRST_LIMIT;
    var walletId = client.credentials.walletId;
    var config = configService.getSync().wallet.settings;

    var fixTxsUnit = function(txs) {
      if (!txs || !txs[0] || !txs[0].amountStr) return;

      var cacheUnit = txs[0].amountStr.split(' ')[1];

      if (cacheUnit == config.unitName)
        return;

      var name = ' ' + config.unitName;

      $log.debug('Fixing Tx Cache Unit to:' + name)
      lodash.each(txs, function(tx) {
        tx.amountStr = profileService.formatAmount(tx.amount) + name;
        tx.feeStr = profileService.formatAmount(tx.fees) + name;
      });
    };

    self.getSavedTxs(walletId, function(err, txsFromLocal) {
      if (err) return cb(err);

      fixTxsUnit(txsFromLocal);

      var confirmedTxs = self.removeAndMarkSoftConfirmedTx(txsFromLocal);
      var endingTxid = confirmedTxs[0] ? confirmedTxs[0].txid : null;
      var endingTs = confirmedTxs[0] ? confirmedTxs[0].time : null;


      // First update
      if (walletId == profileService.focusedClient.credentials.walletId) {
        self.allAssetHistory = self.completeHistory = txsFromLocal;
        updateHistoryColors(function() {
          updateAndFilterHistory();
        });
      }

      if (historyUpdateInProgress[walletId])
        return;

      historyUpdateInProgress[walletId] = true;

      function getNewTxs(newTxs, skip, i_cb) {
        self.getTxsFromServer(client, skip, endingTxid, requestLimit, function(err, res, shouldContinue) {
          if (err) return i_cb(err);

          newTxs = newTxs.concat(lodash.compact(res));
          skip = skip + requestLimit;

          $log.debug('Syncing TXs. Got:' + newTxs.length + ' Skip:' + skip, ' EndingTxid:', endingTxid, ' Continue:', shouldContinue);

          if (!shouldContinue) {
            newTxs = self.processNewTxs(newTxs);
            $log.debug('Finished Sync: New / soft confirmed Txs: ' + newTxs.length);
            return i_cb(null, newTxs);
          }

          requestLimit = LIMIT;
          getNewTxs(newTxs, skip, i_cb);

          // Progress update
          if (walletId == profileService.focusedClient.credentials.walletId) {
            self.txProgress = newTxs.length;
            if (self.completeHistory < FIRST_LIMIT && txsFromLocal.length == 0) {
              $log.debug('Showing partial history');
              var newHistory = self.processNewTxs(newTxs);
              newHistory = lodash.compact(newHistory.concat(confirmedTxs));
              self.allAssetHistory = self.completeHistory = newHistory;
              updateHistoryColors(function() {
                updateAndFilterHistory(function() {
                  $timeout(function() {
                    $rootScope.$apply();
                  });
                });
              });
            }
          }
        });
      };

      getNewTxs([], 0, function(err, txs) {
        if (err) return cb(err);

        var newHistory = lodash.uniq(lodash.compact(txs.concat(confirmedTxs)), function(x) {
          return x.txid;
        });


        function updateNotes(cb2) {
          if (!endingTs) return cb2();

          $log.debug('Syncing notes from: ' + endingTs);
          client.getTxNotes({
            minTs: endingTs
          }, function(err, notes) {
            if (err) {
              $log.warn(err);
              return cb2();
            };
            lodash.each(notes, function(note) {
              $log.debug('Note for ' + note.txid);
              lodash.each(newHistory, function(tx) {
                if (tx.txid == note.txid) {
                  $log.debug('...updating note for ' + note.txid);
                  tx.note = note;
                }
              });
            });
            return cb2();
          });
        }

        updateNotes(function() {
          var historyToSave = JSON.stringify(newHistory);

          lodash.each(txs, function(tx) {
            tx.recent = true;
          })

          $log.debug('Tx History synced. Total Txs: ' + newHistory.length);

          // Final update
          if (walletId == profileService.focusedClient.credentials.walletId) {
            self.completeHistory = newHistory;
            self.allAssetHistory = self.completeHistory = newHistory;
            updateHistoryColors(function() {
              updateAndFilterHistory(function() {
                return storageService.setTxHistory(historyToSave, walletId, function() {
                  $log.debug('Tx History saved.');

                  return cb();
                });
              });
            });
          }
        });
      });
    });
  }

  self.showMore = function() {
    $timeout(function() {
      if (self.isSearching) {
        self.txHistorySearchResults = self.result.slice(0, self.nextTxHistory);
        $log.debug('Total txs: ', self.txHistorySearchResults.length + '/' + self.result.length);
        if (self.txHistorySearchResults.length >= self.result.length)
          self.historyShowMore = false;
      } else {
        self.txHistory = self.completeHistory.slice(0, self.nextTxHistory);
        $log.debug('Total txs: ', self.txHistory.length + '/' + self.completeHistory.length);
        if (self.txHistory.length >= self.completeHistory.length)
          self.historyShowMore = false;
      }
      self.nextTxHistory += self.historyShowMoreLimit;
      $scope.$broadcast('scroll.infiniteScrollComplete');
    }, 100);
  };

  self.startSearch = function() {
    self.isSearching = true;
    self.txHistorySearchResults = [];
    self.result = [];
    self.historyShowMore = false;
    self.nextTxHistory = self.historyShowMoreLimit;
  }

  self.cancelSearch = function() {
    self.isSearching = false;
    self.result = [];
    self.setCompactTxHistory();
  }

  self.updateSearchInput = function(search) {
    self.search = search;
    if (isCordova)
      window.plugins.toast.hide();
    self.throttleSearch();
    $ionicScrollDelegate.resize();
  }

  self.throttleSearch = lodash.throttle(function() {

    function filter(search) {
      self.result = [];

      function computeSearchableString(tx) {
        var addrbook = '';
        if (tx.addressTo && self.addressbook && self.addressbook[tx.addressTo]) addrbook = self.addressbook[tx.addressTo] || '';
        var searchableDate = computeSearchableDate(new Date(tx.time * 1000));
        var message = tx.message ? tx.message : '';
        var comment = tx.note ? tx.note.body : '';
        var addressTo = tx.addressTo ? tx.addressTo : '';
        return ((tx.amountStr + message + addressTo + addrbook + searchableDate + comment).toString()).toLowerCase();
      }

      function computeSearchableDate(date) {
        var day = ('0' + date.getDate()).slice(-2).toString();
        var month = ('0' + (date.getMonth() + 1)).slice(-2).toString();
        var year = date.getFullYear();
        return [month, day, year].join('/');
      };

      if (lodash.isEmpty(search)) {
        self.historyShowMore = false;
        return [];
      }
      self.result = lodash.filter(self.completeHistory, function(tx) {
        if (!tx.searcheableString) tx.searcheableString = computeSearchableString(tx);
        return lodash.includes(tx.searcheableString, search.toLowerCase());
      });

      if (self.result.length > self.historyShowLimit) self.historyShowMore = true;
      else self.historyShowMore = false;

      return self.result;
    };

    self.txHistorySearchResults = filter(self.search).slice(0, self.historyShowLimit);
    if (isCordova)
      window.plugins.toast.showShortBottom(gettextCatalog.getString('Matches: ' + self.result.length));

    $timeout(function() {
      $rootScope.$apply();
    });

  }, 1000);

  self.getTxsFromServer = function(client, skip, endingTxid, limit, cb) {
    var res = [];

    client.getTxHistory({
      skip: skip,
      limit: limit
    }, function(err, txsFromServer) {
      if (err) return cb(err);

      if (!txsFromServer.length)
        return cb();

      var res = lodash.takeWhile(txsFromServer, function(tx) {
        return tx.txid != endingTxid;
      });

      return cb(null, res, res.length == limit);
    });
  };

  self.updateHistory = function() {
    var fc = profileService.focusedClient;
    if (!fc) return;
    var walletId = fc.credentials.walletId;

    if (!fc.isComplete()) {
      return;
    }

    $log.debug('Updating Transaction History');
    self.txHistoryError = false;
    self.updatingTxHistory = true;

    $timeout(function() {
      self.updateLocalTxHistory(fc, function(err) {
        historyUpdateInProgress[walletId] = self.updatingTxHistory = false;
        self.loadingWallet = false;
        self.txProgress = 0;
        if (err)
          self.txHistoryError = true;

        $timeout(function() {
          self.newTx = false
        }, 1000);

        $rootScope.$apply();
      });
    });
  };

  self.setCompactTxHistory = function() {
    self.isSearching = false;
    self.nextTxHistory = self.historyShowMoreLimit;
    self.txHistory = self.completeHistory ? self.completeHistory.slice(0, self.historyShowLimit) : null;
    self.historyShowMore = self.completeHistory ? self.completeHistory.length > self.historyShowLimit : null;
  };

  self.debounceUpdateHistory = lodash.debounce(function() {
    self.updateHistory();
  }, 1000);

  self.throttledUpdateHistory = lodash.throttle(function() {
    self.updateHistory();
  }, 5000);

  self.showErrorPopup = function(msg, cb) {
    $log.warn('Showing err popup:' + msg);

    function openErrorPopup(msg, cb) {
      $scope.msg = msg;

      self.errorPopup = $ionicPopup.show({
        templateUrl: 'views/includes/alert.html',
        scope: $scope,
      });

      $scope.close = function() {
        return cb();
      };
    }

    openErrorPopup(msg, function() {
      self.errorPopup.close();
      if (cb) return cb();
    });
  };

  self.recreate = function(cb) {
    var fc = profileService.focusedClient;
    ongoingProcess.set('recreating', true);
    fc.recreateWallet(function(err) {
      self.notAuthorized = false;
      ongoingProcess.set('recreating', false);

      if (err) {
        self.handleError(err);
        $rootScope.$apply();
        return;
      }

      profileService.bindWalletClient(fc, {
        force: true
      });
      self.startScan(self.walletId);
    });
  };

  self.toggleLeftMenu = function() {
    profileService.isDisclaimerAccepted(function(val) {
      if (val) go.toggleLeftMenu();
      else
        $log.debug('Disclaimer not accepted, cannot open menu');
    });
  };

  self.retryScan = function() {
    var self = this;
    self.startScan(self.walletId);
  }

  self.startScan = function(walletId) {
    $log.debug('Scanning wallet ' + walletId);
    var c = profileService.walletClients[walletId];
    if (!c.isComplete()) return;

    if (self.walletId == walletId)
      self.updating = true;

    c.startScan({
      includeCopayerBranches: true,
    }, function(err) {
      if (err && self.walletId == walletId) {
        self.updating = false;
        self.handleError(err);
        $rootScope.$apply();
      }
    });
  };

  self.initGlidera = function(accessToken) {
    self.glideraEnabled = configService.getSync().glidera.enabled;
    self.glideraTestnet = configService.getSync().glidera.testnet;
    var network = self.glideraTestnet ? 'testnet' : 'livenet';

    self.glideraToken = null;
    self.glideraError = null;
    self.glideraPermissions = null;
    self.glideraEmail = null;
    self.glideraPersonalInfo = null;
    self.glideraTxs = null;
    self.glideraStatus = null;

    if (!self.glideraEnabled) return;

    glideraService.setCredentials(network);

    var getToken = function(cb) {
      if (accessToken) {
        cb(null, accessToken);
      } else {
        storageService.getGlideraToken(network, cb);
      }
    };

    getToken(function(err, accessToken) {
      if (err || !accessToken) return;
      else {
        glideraService.getAccessTokenPermissions(accessToken, function(err, p) {
          if (err) {
            self.glideraError = err;
          } else {
            self.glideraToken = accessToken;
            self.glideraPermissions = p;
            self.updateGlidera({
              fullUpdate: true
            });
          }
        });
      }
    });
  };

  self.updateGlidera = function(opts) {
    if (!self.glideraToken || !self.glideraPermissions) return;
    var accessToken = self.glideraToken;
    var permissions = self.glideraPermissions;

    opts = opts || {};

    glideraService.getStatus(accessToken, function(err, data) {
      self.glideraStatus = data;
    });

    glideraService.getLimits(accessToken, function(err, limits) {
      self.glideraLimits = limits;
    });

    if (permissions.transaction_history) {
      glideraService.getTransactions(accessToken, function(err, data) {
        self.glideraTxs = data;
      });
    }

    if (permissions.view_email_address && opts.fullUpdate) {
      glideraService.getEmail(accessToken, function(err, data) {
        self.glideraEmail = data.email;
      });
    }
    if (permissions.personal_info && opts.fullUpdate) {
      glideraService.getPersonalInfo(accessToken, function(err, data) {
        self.glideraPersonalInfo = data;
      });
    }

  };

  self.filterProposals = function(txp) {
    if (self.asset.isAsset) {
      // for asset wallet show only colored tx of the wallet color
      return txp.isAsset && txp.customData.asset.assetId === self.asset.assetId;
    } else {
      return !txp.isAsset; // show only colorless tx for btc wallet
    }
  };

  self.filterHistory = function(tx) {
    if (self.asset.isAsset) {
      // for asset wallet show only colored tx of the wallet color
      return tx.isColored && tx.assetId === self.asset.assetId;
    } else {
      return !tx.isColored; // show only colorless tx for btc wallet
    }
  };

  self.initCoinbase = function(accessToken) {
    self.coinbaseEnabled = configService.getSync().coinbase.enabled;
    self.coinbaseTestnet = configService.getSync().coinbase.testnet;
    var network = self.coinbaseTestnet ? 'testnet' : 'livenet';

    self.coinbaseToken = null;
    self.coinbaseError = null;
    self.coinbasePermissions = null;
    self.coinbaseEmail = null;
    self.coinbasePersonalInfo = null;
    self.coinbaseTxs = null;
    self.coinbaseStatus = null;

    if (!self.coinbaseEnabled) return;

    coinbaseService.setCredentials(network);

    var getToken = function(cb) {
      if (accessToken) {
        cb(null, accessToken);
      } else {
        storageService.getCoinbaseToken(network, cb);
      }
    };

    getToken(function(err, accessToken) {
      if (err || !accessToken) return;
      else {
        coinbaseService.getAccounts(accessToken, function(err, a) {
          if (err) {
            self.coinbaseError = err;
            if (err.errors[0] && err.errors[0].id == 'expired_token') {
              self.refreshCoinbaseToken();
            }
          } else {
            self.coinbaseToken = accessToken;
            lodash.each(a.data, function(account) {
              if (account.primary && account.type == 'wallet') {
                self.coinbaseAccount = account;
                self.updateCoinbase();
              }
            });
          }
        });
      }
    });
  };

  self.updateCoinbase = lodash.debounce(function(opts) {
    if (!self.coinbaseToken || !self.coinbaseAccount) return;
    var accessToken = self.coinbaseToken;
    var accountId = self.coinbaseAccount.id;

    opts = opts || {};

    if (opts.updateAccount) {
      coinbaseService.getAccount(accessToken, accountId, function(err, a) {
        if (err) {
          self.coinbaseError = err;
          if (err.errors[0] && err.errors[0].id == 'expired_token') {
            self.refreshCoinbaseToken();
          }
          return;
        }
        self.coinbaseAccount = a.data;
      });
    }

    coinbaseService.getCurrentUser(accessToken, function(err, u) {
      if (err) {
        self.coinbaseError = err;
        if (err.errors[0] && err.errors[0].id == 'expired_token') {
          self.refreshCoinbaseToken();
        }
        return;
      }
      self.coinbaseUser = u.data;
    });

    coinbaseService.getPendingTransactions(function(err, txs) {
      self.coinbasePendingTransactions = lodash.isEmpty(txs) ? null : txs;
      lodash.forEach(txs, function(dataFromStorage, txId) {
        if ((dataFromStorage.type == 'sell' && dataFromStorage.status == 'completed') ||
          (dataFromStorage.type == 'buy' && dataFromStorage.status == 'completed') ||
          dataFromStorage.status == 'error' ||
          (dataFromStorage.type == 'send' && dataFromStorage.status == 'completed')) return;
        coinbaseService.getTransaction(accessToken, accountId, txId, function(err, tx) {
          if (err) {
            if (err.errors[0] && err.errors[0].id == 'expired_token') {
              self.refreshCoinbaseToken();
              return;
            }
            coinbaseService.savePendingTransaction(dataFromStorage, {
              status: 'error',
              error: err
            }, function(err) {
              if (err) $log.debug(err);
            });
            return;
          }
          _updateCoinbasePendingTransactions(dataFromStorage, tx.data);
          self.coinbasePendingTransactions[txId] = dataFromStorage;
          if (tx.data.type == 'send' && tx.data.status == 'completed' && tx.data.from) {
            coinbaseService.sellPrice(accessToken, dataFromStorage.sell_price_currency, function(err, s) {
              if (err) {
                if (err.errors[0] && err.errors[0].id == 'expired_token') {
                  self.refreshCoinbaseToken();
                  return;
                }
                coinbaseService.savePendingTransaction(dataFromStorage, {
                  status: 'error',
                  error: err
                }, function(err) {
                  if (err) $log.debug(err);
                });
                return;
              }
              var newSellPrice = s.data.amount;
              var variance = Math.abs((newSellPrice - dataFromStorage.sell_price_amount) / dataFromStorage.sell_price_amount * 100);
              if (variance < dataFromStorage.price_sensitivity.value) {
                self.sellPending(tx.data);
              } else {
                var error = {
                  errors: [{
                    message: 'Price falls over the selected percentage'
                  }]
                };
                coinbaseService.savePendingTransaction(dataFromStorage, {
                  status: 'error',
                  error: error
                }, function(err) {
                  if (err) $log.debug(err);
                });
              }
            });
          } else if (tx.data.type == 'buy' && tx.data.status == 'completed' && tx.data.buy) {
            self.sendToCopay(dataFromStorage);
          } else {
            coinbaseService.savePendingTransaction(dataFromStorage, {}, function(err) {
              if (err) $log.debug(err);
            });
          }
        });
      });
    });

  }, 1000);

  var _updateCoinbasePendingTransactions = function(obj /*, …*/ ) {
    for (var i = 1; i < arguments.length; i++) {
      for (var prop in arguments[i]) {
        var val = arguments[i][prop];
        if (typeof val == "object")
          _updateCoinbasePendingTransactions(obj[prop], val);
        else
          obj[prop] = val ? val : obj[prop];
      }
    }
    return obj;
  };

  self.refreshCoinbaseToken = function() {
    var network = self.coinbaseTestnet ? 'testnet' : 'livenet';
    storageService.getCoinbaseRefreshToken(network, function(err, refreshToken) {
      if (!refreshToken) return;
      coinbaseService.refreshToken(refreshToken, function(err, data) {
        if (err) {
          self.coinbaseError = err;
        } else if (data && data.access_token && data.refresh_token) {
          storageService.setCoinbaseToken(network, data.access_token, function() {
            storageService.setCoinbaseRefreshToken(network, data.refresh_token, function() {
              $timeout(function() {
                self.initCoinbase(data.access_token);
              }, 100);
            });
          });
        }
      });
    });
  };

  self.sendToCopay = function(tx) {
    if (!tx) return;
    var data = {
      to: tx.toAddr,
      amount: tx.amount.amount,
      currency: tx.amount.currency,
      description: 'To ColuWallet Wallet'
    };
    coinbaseService.sendTo(self.coinbaseToken, self.coinbaseAccount.id, data, function(err, res) {
      if (err) {
        if (err.errors[0] && err.errors[0].id == 'expired_token') {
          self.refreshCoinbaseToken();
          return;
        }
        coinbaseService.savePendingTransaction(tx, {
          status: 'error',
          error: err
        }, function(err) {
          if (err) $log.debug(err);
        });
      } else {
        if (!res.data.id) {
          coinbaseService.savePendingTransaction(tx, {
            status: 'error',
            error: err
          }, function(err) {
            if (err) $log.debug(err);
          });
          return;
        }
        coinbaseService.getTransaction(self.coinbaseToken, self.coinbaseAccount.id, res.data.id, function(err, sendTx) {
          coinbaseService.savePendingTransaction(tx, {
            remove: true
          }, function(err) {
            coinbaseService.savePendingTransaction(sendTx.data, {}, function(err) {
              $timeout(function() {
                self.updateCoinbase({
                  updateAccount: true
                });
              }, 1000);
            });
          });
        });
      }
    });
  };

  self.sellPending = function(tx) {
    if (!tx) return;
    var data = tx.amount;
    data['commit'] = true;
    coinbaseService.sellRequest(self.coinbaseToken, self.coinbaseAccount.id, data, function(err, res) {
      if (err) {
        if (err.errors[0] && err.errors[0].id == 'expired_token') {
          self.refreshCoinbaseToken();
          return;
        }
        coinbaseService.savePendingTransaction(tx, {
          status: 'error',
          error: err
        }, function(err) {
          if (err) $log.debug(err);
        });
      } else {
        if (!res.data.transaction) {
          coinbaseService.savePendingTransaction(tx, {
            status: 'error',
            error: err
          }, function(err) {
            if (err) $log.debug(err);
          });
          return;
        }
        coinbaseService.savePendingTransaction(tx, {
          remove: true
        }, function(err) {
          coinbaseService.getTransaction(self.coinbaseToken, self.coinbaseAccount.id, res.data.transaction.id, function(err, updatedTx) {
            coinbaseService.savePendingTransaction(updatedTx.data, {}, function(err) {
              if (err) $log.debug(err);
              $timeout(function() {
                self.updateCoinbase({
                  updateAccount: true
                });
              }, 1000);
            });
          });
        });
      }
    });
  };

  self.isInFocus = function(walletId) {
    var fc = profileService.focusedClient;
    return fc && fc.credentials.walletId == walletId;
  };

  self.setAddressbook = function(ab) {
    if (ab) {
      self.addressbook = ab;
      return;
    }

    addressbookService.list(function(err, ab) {
      if (err) {
        $log.error('Error getting the addressbook');
        return;
      }
      self.addressbook = ab;
    });
  };

  $rootScope.$on('$stateChangeSuccess', function(ev, to, toParams, from, fromParams) {
    self.prevState = from.name || 'walletHome';
    self.tab = 'walletHome';
  });

  $rootScope.$on('Local/ValidatingWalletEnded', function(ev, walletId, isOK) {

    if (self.isInFocus(walletId)) {
      // NOTE: If the user changed the wallet, the flag is already turn off.
      self.incorrectDerivation = isOK === false;
    }
  });

  $rootScope.$on('Local/ClearHistory', function(event) {
    $log.debug('The wallet transaction history has been deleted');
    self.txHistory = self.completeHistory = self.txHistorySearchResults = [];
    updateAndFilterHistory(function() {
      self.debounceUpdateHistory();
    });
  });

  $rootScope.$on('Local/AddressbookUpdated', function(event, ab) {
    self.setAddressbook(ab);
  });

  // UX event handlers
  $rootScope.$on('Local/ColorUpdated', function(event) {
    self.updateColor();
    $timeout(function() {
      $rootScope.$apply();
    });
  });

  $rootScope.$on('Local/AliasUpdated', function(event) {
    self.updateAlias();
    $timeout(function() {
      $rootScope.$apply();
    });
  });

  $rootScope.$on('Local/SpendUnconfirmedUpdated', function(event, spendUnconfirmed) {
    self.setSpendUnconfirmed(spendUnconfirmed);
    self.updateAll();
  });

  $rootScope.$on('Local/GlideraUpdated', function(event, accessToken) {
    self.initGlidera(accessToken);
  });

  $rootScope.$on('Local/CoinbaseUpdated', function(event, accessToken) {
    self.initCoinbase(accessToken);
  });

  $rootScope.$on('Local/GlideraTx', function(event, accessToken, permissions) {
    self.updateGlidera();
  });

  $rootScope.$on('Local/CoinbaseTx', function(event) {
    self.updateCoinbase({
      updateAccount: true
    });
  });

  $rootScope.$on('Local/GlideraError', function(event) {
    self.debouncedUpdate();
  });

  $rootScope.$on('Local/UnitSettingUpdated', function(event) {
    self.updateAll({
      triggerTxUpdate: true,
    });
  });

  $rootScope.$on('Local/WalletCompleted', function(event, walletId) {
    if (self.isInFocus(walletId)) {
      // reset main wallet variables
      self.setFocusedWallet();
      go.walletHome();
    }
  });

  self.debouncedUpdate = function() {
    var now = Date.now();
    var oneHr = 1000 * 60 * 60;

    if (!self.lastUpdate || (now - self.lastUpdate) > oneHr) {
      self.updateAll({
        quiet: true,
        triggerTxUpdate: true
      });
    }
  };

  $rootScope.$on('Local/Resume', function(event) {
    $log.debug('### Resume event');
    profileService.isDisclaimerAccepted(function(v) {
      if (!v) {
        $log.debug('Disclaimer not accepted, resume to home');
        go.path('disclaimer');
      }
    });
    self.debouncedUpdate();
  });

  $rootScope.$on('Local/BackupDone', function(event, walletId) {
    self.needsBackup = false;
    $log.debug('Backup done');
    storageService.setBackupFlag(walletId || self.walletId, function(err) {
      $log.debug('Backup stored');
    });
  });

  $rootScope.$on('Local/DeviceError', function(event, err) {
    self.showErrorPopup(err, function() {
      if (isCordova && navigator && navigator.app) {
        navigator.app.exitApp();
      }
    });
  });

  var updateHistoryColors = function(cb) {
    coloredCoins.whenAvailable(function(assets, coloredTxs) {
      lodash.forEach(self.allAssetHistory, function(tx) {
        var colorTx = coloredTxs[tx.txid];
        if (tx.isColored || !colorTx || !colorTx.colored) return;

        var nVout = colorTx.ccdata[0].payments[0].output;
        var asset = colorTx.vout[nVout].assets[0];
        tx.assetId = asset.assetId;
        tx.issuanceTxId = asset.issueTxid;

        var amount = lodash.sum(lodash.pluck(colorTx.vout[nVout].assets, 'amount'));
        tx.amountStr = coloredCoins.formatAssetAmount(amount, asset);
        tx.addressTo = tx.outputs[0].toAddress || tx.outputs[0].address;
        tx.hasMultiplesOutputs = false;
        tx.alternativeAmountStr = false;
        tx.isColored = true;
        tx.isAsset = tx.isAsset || true;
      });
      cb(self.allAssetHistory);
    });
  };

  var updateAndFilterProposals = function() {
      self.txps = lodash.filter(self.allTxps, self.filterProposals);
  };

  var updateAndFilterHistory = function(cb) {
    coloredCoins.whenAvailable(function(assets, coloredTxs) {
      self.completeHistory = lodash.filter(self.allAssetHistory, self.filterHistory);
      self.setCompactTxHistory();
      if (cb) cb();
    });
  };

  $rootScope.$on('Local/WalletImported', function(event, walletId) {
    self.needsBackup = false;
    storageService.setBackupFlag(walletId, function() {
      $log.debug('Backup done stored');
      addressService.expireAddress(walletId, function(err) {
        $timeout(function() {
          self.txHistory = self.completeHistory = self.txHistorySearchResults = [];
          updateAndFilterHistory(function() {
            storageService.removeTxHistory(walletId, function() {
              self.startScan(walletId);
            });
          });
        }, 500);
      });
    });
  });

  $rootScope.$on('NewIncomingTx', function() {
    self.newTx = true;
    self.updateAll({
      walletStatus: null,
      untilItChanges: true,
      triggerTxUpdate: true,
    });
  });


  $rootScope.$on('NewBlock', function() {
    if (self.glideraEnabled) {
      $timeout(function() {
        self.updateGlidera();
      });
    }
    if (self.coinbaseEnabled) {
      $timeout(function() {
        self.updateCoinbase();
      });
    }
    if (self.pendingAmount) {
      self.updateAll({
        walletStatus: null,
        untilItChanges: null,
        triggerTxUpdate: true,
      });
    } else if (self.hasUnsafeConfirmed) {
      $log.debug('Wallet has transactions with few confirmations. Updating.')
      if (self.network == 'testnet') {
        self.throttledUpdateHistory();
      } else {
        self.debounceUpdateHistory();
      }
    }
  });

  $rootScope.$on('BalanceUpdated', function(e, n) {
    self.setBalance(n.data);
  });


  //untilItChange TRUE
  lodash.each(['NewOutgoingTx', 'NewOutgoingTxByThirdParty'], function(eventName) {
    $rootScope.$on(eventName, function(event) {
      self.newTx = true;
      self.updateAll({
        walletStatus: null,
        untilItChanges: true,
        triggerTxUpdate: true,
      });
    });
  });

  //untilItChange FALSE
  lodash.each(['NewTxProposal', 'TxProposalFinallyRejected', 'TxProposalRemoved', 'NewOutgoingTxByThirdParty',
    'Local/GlideraTx'
  ], function(eventName) {
    $rootScope.$on(eventName, function(event) {
      self.updateAll({
        walletStatus: null,
        untilItChanges: null,
        triggerTxUpdate: true,
      });
    });
  });


  //untilItChange Maybe
  $rootScope.$on('Local/TxProposalAction', function(event, untilItChanges) {
    self.newTx = untilItChanges;
    self.updateAll({
      walletStatus: null,
      untilItChanges: untilItChanges,
      triggerTxUpdate: true,
    });
  });

  $rootScope.$on('ScanFinished', function() {
    $log.debug('Scan Finished. Updating history');
    storageService.removeTxHistory(self.walletId, function() {
      self.updateAll({
        walletStatus: null,
        triggerTxUpdate: true,
      });
    });
  });

  lodash.each(['TxProposalRejectedBy', 'TxProposalAcceptedBy'], function(eventName) {
    $rootScope.$on(eventName, function() {
      var f = function() {
        if (self.updating) {
          return $timeout(f, 200);
        };
        self.updatePendingTxps();
      };
      f();
    });
  });

  $rootScope.$on('Local/NoWallets', function(event) {
    $timeout(function() {
      self.hasProfile = true;
      self.noFocusedWallet = true;
      self.isComplete = null;
      self.walletName = null;
      uxLanguage.update();
    });
  });

  $rootScope.$on('Local/NewFocusedWallet', function() {
    uxLanguage.update();
    self.setFocusedWallet();
    self.updateHistory();
    storageService.getCleanAndScanAddresses(function(err, walletId) {

      if (walletId && profileService.walletClients[walletId]) {
        $log.debug('Clear last address cache and Scan ', walletId);
        addressService.expireAddress(walletId, function(err) {
          self.startScan(walletId);
        });
        storageService.removeCleanAndScanAddresses(function() {
          $rootScope.$emit('Local/NewFocusedWalletReady');
        });
      } else {
        $rootScope.$emit('Local/NewFocusedWalletReady');
      }
    });
  });

  $rootScope.$on('Local/SetTab', function(event, tab, reset) {
    self.setTab(tab, reset);
  });

  $rootScope.$on('disclaimerAccepted', function(event) {
    $scope.isDisclaimerAccepted = true;
  });

  $rootScope.$on('Local/WindowResize', function() {
    self.physicalScreenWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width);
  });

  $rootScope.$on('Local/NeedsConfirmation', function(event, txp, cb) {

    function openConfirmationPopup(txp, cb) {

      var config = configService.getSync();
      config.colorFor = config.colorFor || {};
      $scope.color = config.colorFor[txp.walletId] || '#4A90E2';
      $scope.tx = txFormatService.processTx(txp);

      self.confirmationPopup = $ionicPopup.show({
        templateUrl: 'views/includes/confirm-tx.html',
        scope: $scope,
      });

      $scope.processFee = function(amount, fee) {
        var walletSettings = configService.getSync().wallet.settings;
        var feeAlternativeIsoCode = walletSettings.alternativeIsoCode;

        $scope.feeLevel = feeService.feeOpts[feeService.getCurrentFeeLevel()];
        $scope.feeAlternativeStr = parseFloat((rateService.toFiat(fee, feeAlternativeIsoCode)).toFixed(2), 10) + ' ' + feeAlternativeIsoCode;
        $scope.feeRateStr = (fee / (amount + fee) * 100).toFixed(2) + '%';
      };

      $scope.cancel = function() {
        return cb();
      };

      $scope.accept = function() {
        return cb(true);
      };
    }

    openConfirmationPopup(txp, function(accept) {
      self.confirmationPopup.close();
      return cb(accept);
    });
  });

  $rootScope.$on('Local/NeedsPassword', function(event, isSetup, cb) {

    function openPasswordPopup(isSetup, cb) {
      $scope.data = {};
      $scope.data.password = null;
      $scope.isSetup = isSetup;
      $scope.isVerification = false;
      $scope.loading = false;
      var pass = null;

      self.passwordPopup = $ionicPopup.show({
        templateUrl: 'views/includes/password.html',
        scope: $scope,
      });

      $scope.cancel = function() {
        return cb('No spending password given');
      };

      $scope.keyPress = function(event) {
        if (!$scope.data.password || $scope.loading) return;
        if (event.keyCode == 13) $scope.set();
      }

      $scope.set = function() {
        $scope.loading = true;
        $scope.error = null;

        $timeout(function() {
          if (isSetup && !$scope.isVerification) {
            $scope.loading = false;
            $scope.isVerification = true;
            pass = $scope.data.password;
            $scope.data.password = null;
            return;
          }
          if (isSetup && pass != $scope.data.password) {
            $scope.loading = false;
            $scope.error = gettext('Spending Passwords do not match');
            $scope.isVerification = false;
            $scope.data.password = null;
            pass = null;
            return;
          }
          return cb(null, $scope.data.password);
        }, 100);
      };
    };

    openPasswordPopup(isSetup, function(err, pass) {
      self.passwordPopup.close();
      return cb(err, pass);
    });

  });

  $rootScope.$on('Local/EmailUpdated', function(event, email) {
    self.preferences.email = email;
  });

  lodash.each(['NewCopayer', 'CopayerUpdated'], function(eventName) {
    $rootScope.$on(eventName, function() {
      // Re try to open wallet (will triggers)
      self.setFocusedWallet();
    });
  });

  $rootScope.$on('Local/NewEncryptionSetting', function() {
    var fc = profileService.focusedClient;
    self.isPrivKeyEncrypted = fc.isPrivKeyEncrypted();
    $timeout(function() {
      $rootScope.$apply();
    });
  });


  /* Start setup */
  lodash.assign(self, vanillaScope);
  openURLService.init();
});

'use strict';

angular.module('copayApp.controllers').controller('joinController',
  function($scope, $rootScope, $timeout, go, notification, profileService, configService, storageService, applicationService, gettext, lodash, ledger, trezor, platformInfo, derivationPathHelper, ongoingProcess) {

    var isChromeApp = platformInfo.isChromeApp;
    var isDevel = platformInfo.isDevel;

    var self = this;
    var defaults = configService.getDefaults();
    $scope.bwsurl = defaults.bws.url;
    $scope.derivationPath = derivationPathHelper.default;
    $scope.account = 1;

    this.onQrCodeScanned = function(data) {
      $scope.secret = data;
      $scope.joinForm.secret.$setViewValue(data);
      $scope.joinForm.secret.$render();
    };

    var updateSeedSourceSelect = function() {
      self.seedOptions = [{
        id: 'new',
        label: gettext('Random'),
      }, {
        id: 'set',
        label: gettext('Specify Recovery Phrase...'),
      }];
      $scope.seedSource = self.seedOptions[0];


      if (isChromeApp) {
        self.seedOptions.push({
          id: 'ledger',
          label: 'Ledger Hardware Wallet',
        });
      }

      if (isChromeApp || isDevel) {
        self.seedOptions.push({
          id: 'trezor',
          label: 'Trezor Hardware Wallet',
        });
      }
    };

    this.setSeedSource = function() {
      self.seedSourceId = $scope.seedSource.id;

      $timeout(function() {
        $rootScope.$apply();
      });
    };

    this.join = function(form) {
      if (form && form.$invalid) {
        self.error = gettext('Please enter the required fields');
        return;
      }

      var opts = {
        secret: form.secret.$modelValue,
        myName: form.myName.$modelValue,
        bwsurl: $scope.bwsurl,
      }

      var setSeed = self.seedSourceId == 'set';
      if (setSeed) {
        var words = form.privateKey.$modelValue;
        if (words.indexOf(' ') == -1 && words.indexOf('prv') == 1 && words.length > 108) {
          opts.extendedPrivateKey = words;
        } else {
          opts.mnemonic = words;
        }
        opts.passphrase = form.passphrase.$modelValue;

        var pathData = derivationPathHelper.parse($scope.derivationPath);
        if (!pathData) {
          this.error = gettext('Invalid derivation path');
          return;
        }
        opts.account = pathData.account;
        opts.networkName = pathData.networkName;
        opts.derivationStrategy = pathData.derivationStrategy;
      } else {
        opts.passphrase = form.createPassphrase.$modelValue;
      }

      opts.walletPrivKey = $scope._walletPrivKey; // Only for testing


      if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {

        this.error = gettext('Please enter the wallet recovery phrase');
        return;
      }

      if (self.seedSourceId == 'ledger' || self.seedSourceId == 'trezor') {
        var account = $scope.account;
        if (!account || account < 1) {
          this.error = gettext('Invalid account number');
          return;
        }

        if (self.seedSourceId == 'trezor')
          account = account - 1;

        opts.account = account;
        ongoingProcess.set('connecting' + self.seedSourceId, true);
        var src = self.seedSourceId == 'ledger' ? ledger : trezor;

        src.getInfoForNewWallet(true, account, function(err, lopts) {
          ongoingProcess.set('connecting' + self.seedSourceId, false);
          if (err) {
            self.error = err;
            $scope.$apply();
            return;
          }
          opts = lodash.assign(lopts, opts);
          self._join(opts);
        });
      } else {

        self._join(opts);
      }
    };

    this._join = function(opts) {
      ongoingProcess.set('joiningWallet', true);
      $timeout(function() {
        profileService.joinWallet(opts, function(err) {
          ongoingProcess.set('joiningWallet', false);
          if (err) {
            self.error = err;
            $rootScope.$apply();
            return;
          }
          go.walletHome();
        });
      }, 100);
    };

    updateSeedSourceSelect();
    self.setSeedSource();
  });

'use strict';

angular.module('copayApp.controllers').controller('addressbookController', function($rootScope, $scope, $timeout, lodash, profileService, addressService, addressbookService, bwcError) {
  var self = $scope.self;

  var fc = profileService.focusedClient;
  self.lockAddress = false;
  self._address = null;
  $scope.editAddressbook = false;
  $scope.addAddressbookEntry = false;
  $scope.selectedAddressbook = {};
  $scope.newAddress = address;
  $scope.walletName = fc.credentials.walletName;
  $scope.color = fc.backgroundColor;
  $scope.addressbook = {
    'address': ($scope.newAddress || ''),
    'label': ''
  };

  $scope.checkClipboard = function() {
    if (!$scope.newAddress) {
      getClipboard(function(value) {
        $scope.newAddress = value;
      });
    }
  };

  $scope.beforeQrCodeScann = function() {
    $scope.error = null;
    $scope.addAddressbookEntry = true;
    $scope.editAddressbook = false;
  };

  $scope.onQrCodeScanned = function(data, addressbookForm) {
    $timeout(function() {
      var form = addressbookForm;
      if (data && form) {
        data = data.replace('bitcoin:', '');
        form.address.$setViewValue(data);
        form.address.$isValid = true;
        form.address.$render();
      }
      $scope.$digest();
    }, 100);
  };

  $scope.toggleEditAddressbook = function() {
    $scope.editAddressbook = !$scope.editAddressbook;
    $scope.selectedAddressbook = {};
    $scope.addAddressbookEntry = false;
  };

  $scope.selectAddressbook = function(addr) {
    self.setForm(addr);
    $scope.cancel();
  };

  $scope.toggleSelectAddressbook = function(addr) {
    $scope.selectedAddressbook[addr] = $scope.selectedAddressbook[addr] ? false : true;
  };

  $scope.toggleAddAddressbookEntry = function() {
    $scope.error = null;
    $scope.addressbook = {
      'address': '',
      'label': ''
    };
    $scope.addAddressbookEntry = !$scope.addAddressbookEntry;
  };

  $scope.contactList = function() {
    $scope.error = null;
    addressbookService.list(function(err, ab) {
      if (err) {
        $scope.error = err;
        return;
      }
      $scope.list = ab;
      $scope.isEmptyList = lodash.isEmpty($scope.list);
      $timeout(function() {
        $scope.$digest();
      });
    });
  };

  $scope.setSelectedWalletsOpt = function(val) {
    $scope.selectedWalletsOpt = val;
  };

  $scope.add = function(addressbook) {
    $scope.error = null;
    $timeout(function() {
      addressbookService.add(addressbook, function(err, ab) {
        if (err) {
          $scope.error = err;
          return;
        }
        $rootScope.$emit('Local/AddressbookUpdated', ab);
        $scope.list = ab;
        $scope.isEmptyList = lodash.isEmpty($scope.list);
        $scope.editAddressbook = true;
        $scope.toggleEditAddressbook();
        $scope.$digest();
      });
    }, 100);
  };

  $scope.remove = function(addr) {
    $scope.error = null;
    $timeout(function() {
      addressbookService.remove(addr, function(err, ab) {
        if (err) {
          $scope.error = err;
          return;
        }
        $rootScope.$emit('Local/AddressbookUpdated', ab);
        $scope.list = ab;
        $scope.isEmptyList = lodash.isEmpty($scope.list);
        if ($scope.isEmptyList)
          $scope.editAddressbook = false;
        $scope.$digest();
      });
    }, 100);
  };

  $scope.selectWallet = function(walletId, walletName) {
    var client = profileService.getClient(walletId);
    $scope.errorSelectedWallet = {};

    profileService.isReady(client, function(err) {
      if (err) $scope.errorSelectedWallet[walletId] = bwcError.msg(err);
      else {
        $scope.gettingAddress = true;
        $scope.selectedWalletName = walletName;

        addressService.getAddress(walletId, false, function(err, addr) {
          $scope.gettingAddress = false;
          if (err) {
            self.error = err;
            $scope.cancelAddress();
            return;
          }

          self.setForm(addr);
          $scope.cancel();
        });
      }
      $timeout(function() {
        $scope.$apply();
      });
    });
  };

  $scope.cancelAddress = function() {
    self.resetForm();
    $scope.cancel();
  };

  $scope.cancel = function() {
    $scope.addressbookModal.hide();
  };
});

'use strict';

angular.module('copayApp.controllers')
  .controller('addTokenController', function(
    $scope,
    $rootScope,
    $timeout,
    $log,
    storageService,
    assetService
) {

  var self = this;

  this.updating = false;

  this.addToken = function(form) {
    if (form && form.$invalid) {
      self.error = 'Please enter the required fields';
      return;
    }

    var newAsset = {
      assetId: form.assetId.$modelValue,
      symbol: form.symbol.$modelValue,
      pluralSymbol: form.symbol.$modelValue,
      custom: true
    };

    self.updating = true;

    assetService.addCustomAsset(newAsset, function(err) {
      if (err) {
        $timeout(function() {
          self.error = err;
          self.updating = false;
        });
        return;
      }
      $scope.$emit('Local/NewCustomAsset');
      assetService.setSupportedAssets(function() {
        $rootScope.$emit('Local/RefreshAssets');
        self.updating = false;
      });
      $scope.close();
    });
  };


  $scope.close = function() {
    $scope.addTokenModal.hide();
  };
});

'use strict';

angular.module('copayApp.controllers').controller('amazonCardDetailsController', function($scope, $log, $timeout, bwcError, amazonService, lodash, ongoingProcess) {

  $scope.cancelGiftCard = function() {
    ongoingProcess.set('Canceling gift card...', true);
    amazonService.cancelGiftCard($scope.card, function(err, data) {
      ongoingProcess.set('Canceling gift card...', false);
      if (err) {
        $scope.error = bwcError.msg(err);
        return;
      }
      $scope.card.cardStatus = data.cardStatus;
      amazonService.savePendingGiftCard($scope.card, null, function(err) {
        $scope.$emit('UpdateAmazonList');
      });
    });
  };

  $scope.remove = function() {
    amazonService.savePendingGiftCard($scope.card, {
      remove: true
    }, function(err) {
      $scope.$emit('UpdateAmazonList');
      $scope.cancel();
    });
  };

  $scope.refreshGiftCard = function() {
    amazonService.getPendingGiftCards(function(err, gcds) {
      if (err) {
        self.error = err;
        return;
      }
      lodash.forEach(gcds, function(dataFromStorage) {
        if (dataFromStorage.status == 'PENDING' && dataFromStorage.invoiceId == $scope.card.invoiceId) {
          $log.debug("creating gift card");
          amazonService.createGiftCard(dataFromStorage, function(err, giftCard) {
            if (err) {
              self.error = bwcError.msg(err);
              $log.debug(bwcError.msg(err));
              return;
            }
            if (!lodash.isEmpty(giftCard)) {
              var newData = {};
              lodash.merge(newData, dataFromStorage, giftCard);
              amazonService.savePendingGiftCard(newData, null, function(err) {
                $log.debug("Saving new gift card");
                $scope.card = newData;
                $scope.$emit('UpdateAmazonList');
                $timeout(function() {
                  $scope.$digest();
                });
              });
            } else $log.debug("pending gift card not available yet");
          });
        }
      });
    });
  };

  $scope.cancel = function() {
    $scope.amazonCardDetailsModal.hide();
  };

});

'use strict';

angular.module('copayApp.controllers').controller('coinbaseConfirmationController', function($scope, $timeout, coinbaseService, applicationService) {

  $scope.ok = function() {

    coinbaseService.logout($scope.network, function() {

      $timeout(function() {
        applicationService.restart();
      }, 1000);
    });
    $scope.cancel();
  };

  $scope.cancel = function() {
    $scope.coinbaseConfirmationModal.hide();
  };

});

'use strict';

angular.module('copayApp.controllers').controller('coinbaseTxDetailsController', function($scope, $rootScope, coinbaseService) {

  $scope.remove = function() {
    coinbaseService.savePendingTransaction($scope.tx, {
      remove: true
    }, function(err) {
      $rootScope.$emit('Local/CoinbaseTx');
      $scope.cancel();
    });
  };

  $scope.cancel = function() {
    $scope.coinbaseTxDetailsModal.hide();
  };

});

'use strict';

angular.module('copayApp.controllers').controller('confirmationController', function($scope) {

  $scope.ok = function() {
    $scope.loading = true;
    $scope.okAction();
    $scope.confirmationModal.hide();
  };

  $scope.cancel = function() {
    $scope.confirmationModal.hide();
  };

});

'use strict';

angular.module('copayApp.controllers').controller('customAmountController', function($scope, $timeout, $filter, platformInfo, rateService) {
  var self = $scope.self;

  $scope.unitName = self.unitName;
  $scope.alternativeAmount = self.alternativeAmount;
  $scope.alternativeName = self.alternativeName;
  $scope.alternativeIsoCode = self.alternativeIsoCode;
  $scope.isRateAvailable = self.isRateAvailable;
  $scope.unitToSatoshi = self.unitToSatoshi;
  $scope.unitDecimals = self.unitDecimals;
  var satToUnit = 1 / self.unitToSatoshi;
  $scope.showAlternative = false;
  $scope.isCordova = platformInfo.isCordova;

  Object.defineProperty($scope,
    "_customAlternative", {
      get: function() {
        return $scope.customAlternative;
      },
      set: function(newValue) {
        $scope.customAlternative = newValue;
        if (typeof(newValue) === 'number' && $scope.isRateAvailable) {
          $scope.customAmount = parseFloat((rateService.fromFiat(newValue, $scope.alternativeIsoCode) * satToUnit).toFixed($scope.unitDecimals), 10);
        } else {
          $scope.customAmount = null;
        }
      },
      enumerable: true,
      configurable: true
    });

  Object.defineProperty($scope,
    "_customAmount", {
      get: function() {
        return $scope.customAmount;
      },
      set: function(newValue) {
        $scope.customAmount = newValue;
        if (typeof(newValue) === 'number' && $scope.isRateAvailable) {
          $scope.customAlternative = parseFloat((rateService.toFiat(newValue * $scope.unitToSatoshi, $scope.alternativeIsoCode)).toFixed(2), 10);
        } else {
          $scope.customAlternative = null;
        }
        $scope.alternativeAmount = $scope.customAlternative;
      },
      enumerable: true,
      configurable: true
    });

  $scope.submitForm = function(form) {
    var satToBtc = 1 / 100000000;
    var amount = form.amount.$modelValue;
    var amountSat = parseInt((amount * $scope.unitToSatoshi).toFixed(0));
    $timeout(function() {
      $scope.customizedAmountUnit = amount + ' ' + $scope.unitName;
      $scope.customizedAlternativeUnit = $filter('formatFiatAmount')(form.alternative.$modelValue) + ' ' + $scope.alternativeIsoCode;
      if ($scope.unitName == 'bits') {
        amount = (amountSat * satToBtc).toFixed(8);
      }
      $scope.customizedAmountBtc = amount;
    }, 1);
  };

  $scope.toggleAlternative = function() {
    $scope.showAlternative = !$scope.showAlternative;
  };

  $scope.shareAddress = function(uri) {
    if (platformInfo.isCordova) {
      window.plugins.socialsharing.share(uri, null, null, null);
    }
  };

  $scope.cancel = function() {
    $scope.customAmountModal.hide();
  };
});

'use strict';

angular.module('copayApp.controllers').controller('glideraConfirmationController', function($scope, $timeout, storageService, applicationService) {

  $scope.ok = function() {
    storageService.removeGlideraToken($scope.network, function() {
      $timeout(function() {
        applicationService.restart();
      }, 100);
    });
    $scope.cancel();
  };

  $scope.cancel = function() {
    $scope.glideraConfirmationModal.hide();
  };

});

'use strict';

angular.module('copayApp.controllers').controller('glideraTxDetailsController', function($scope) {

  $scope.cancel = function() {
    $scope.glideraTxDetailsModal.hide();
  };

});

'use strict';

angular.module('copayApp.controllers').controller('inputAmountController', function($rootScope, $scope, $filter, $timeout, $ionicScrollDelegate, profileService, platformInfo, lodash, configService, go, rateService) {
  var unitToSatoshi;
  var satToUnit;
  var unitDecimals;
  var satToBtc;
  var self = $scope.self;
  var SMALL_FONT_SIZE_LIMIT = 13;
  var LENGTH_EXPRESSION_LIMIT = 19;

  $scope.init = function() {
    var config = configService.getSync().wallet.settings;
    $scope.unitName = config.unitName;
    $scope.alternativeIsoCode = config.alternativeIsoCode;
    $scope.specificAmount = $scope.specificAlternativeAmount = '';
    $scope.isCordova = platformInfo.isCordova;
    unitToSatoshi = config.unitToSatoshi;
    satToUnit = 1 / unitToSatoshi;
    satToBtc = 1 / 100000000;
    unitDecimals = config.unitDecimals;
    processAmount($scope.amount);
    $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 100);
  };

  $scope.shareAddress = function(uri) {
    if ($scope.isCordova) {
      window.plugins.socialsharing.share(uri, null, null, null);
    }
  };

  $scope.toggleAlternative = function() {
    $scope.showAlternativeAmount = !$scope.showAlternativeAmount;

    if ($scope.amount && isExpression($scope.amount)) {
      var amount = evaluate(format($scope.amount));
      $scope.globalResult = '= ' + processResult(amount);
    }
  };

  function checkFontSize() {
    if ($scope.amount && $scope.amount.length >= SMALL_FONT_SIZE_LIMIT) $scope.smallFont = true;
    else $scope.smallFont = false;
  };

  $scope.pushDigit = function(digit) {
    if ($scope.amount && $scope.amount.length >= LENGTH_EXPRESSION_LIMIT) return;

    $scope.amount = ($scope.amount + digit).replace('..', '.');
    checkFontSize();
    processAmount($scope.amount);
  };

  $scope.pushOperator = function(operator) {
    if (!$scope.amount || $scope.amount.length == 0) return;
    $scope.amount = _pushOperator($scope.amount);

    function _pushOperator(val) {
      if (!isOperator(lodash.last(val))) {
        return val + operator;
      } else {
        return val.slice(0, -1) + operator;
      }
    };
  };

  function isOperator(val) {
    var regex = /[\/\-\+\x\*]/;
    return regex.test(val);
  };

  function isExpression(val) {
    var regex = /^\.?\d+(\.?\d+)?([\/\-\+\*x]\d?\.?\d+)+$/;

    return regex.test(val);
  };

  $scope.removeDigit = function() {
    $scope.amount = $scope.amount.slice(0, -1);
    processAmount($scope.amount);
    checkFontSize();
  };

  $scope.resetAmount = function() {
    $scope.amount = $scope.alternativeResult = $scope.amountResult = $scope.globalResult = '';
    checkFontSize();
  };

  function processAmount(val) {
    if (!val) {
      $scope.resetAmount();
      return;
    }

    var formatedValue = format(val);
    var result = evaluate(formatedValue);

    if (lodash.isNumber(result)) {
      $scope.globalResult = isExpression(val) ? '= ' + processResult(result) : '';
      $scope.amountResult = $filter('formatFiatAmount')(toFiat(result));
      $scope.alternativeResult = profileService.formatAmount(fromFiat(result) * unitToSatoshi, true);
    }
  };

  function processResult(val) {
    if ($scope.showAlternativeAmount)
      return $filter('formatFiatAmount')(val);
    else
      return profileService.formatAmount(val.toFixed(unitDecimals) * unitToSatoshi, true);
  };

  function fromFiat(val) {
    return parseFloat((rateService.fromFiat(val, $scope.alternativeIsoCode) * satToUnit).toFixed(unitDecimals), 10);
  };

  function toFiat(val) {
    return parseFloat((rateService.toFiat(val * unitToSatoshi, $scope.alternativeIsoCode)).toFixed(2), 10);
  };

  function evaluate(val) {
    var result;
    try {
      result = $scope.$eval(val);
    } catch (e) {
      return 0;
    }
    if (!lodash.isFinite(result)) return 0;
    return result;
  };

  function format(val) {
    var result = val.toString();

    if (isOperator(lodash.last(val)))
      result = result.slice(0, -1);

    return result.replace('x', '*');
  };

  $scope.finish = function() {
    var _amount = evaluate(format($scope.amount));
    var amount = $scope.showAlternativeAmount ? fromFiat(_amount).toFixed(unitDecimals) : _amount.toFixed(unitDecimals);
    var alternativeAmount = $scope.showAlternativeAmount ? _amount : toFiat(_amount);

    if (amount % 1 == 0) amount = parseInt(amount);

    if ($scope.addr) {
      $scope.specificAmount = profileService.formatAmount(amount * unitToSatoshi, true);
      $scope.specificAlternativeAmount = $filter('formatFiatAmount')(alternativeAmount);

      if ($scope.unitName == 'bits') {
        var amountSat = parseInt((amount * unitToSatoshi).toFixed(0));
        amount = (amountSat * satToBtc).toFixed(8);
      }
      $scope.customizedAmountBtc = amount;

      $timeout(function() {
        $ionicScrollDelegate.resize();
      }, 100);
    } else {
      self.setAmount(amount, $scope.showAlternativeAmount);
      $scope.cancel();
    }
  };

  $scope.cancel = function() {
    $scope.inputAmountModal.hide();
  };
});

'use strict';

angular.module('copayApp.controllers').controller('payproController', function($scope) {
  var self = $scope.self;

  $scope.alternative = self.alternativeAmount;
  $scope.alternativeIsoCode = self.alternativeIsoCode;
  $scope.isRateAvailable = self.isRateAvailable;
  $scope.unitTotal = ($scope.paypro.amount * self.satToUnit).toFixed(self.unitDecimals);
  $scope.unitName = self.unitName;

  $scope.cancel = function() {
    $scope.payproModal.hide();
  };
});

'use strict';

angular.module('copayApp.controllers').controller('scannerController', function($scope, $timeout) {

  // QR code Scanner
  var video;
  var canvas;
  var $video;
  var context;
  var localMediaStream;
  var prevResult;
  var scanTimer;

  var _scan = function(evt) {
    if (localMediaStream) {
      context.drawImage(video, 0, 0, 300, 225);
      try {
        qrcode.decode();
      } catch (e) {
        //qrcodeError(e);
      }
    }
    scanTimer = $timeout(_scan, 800);
  };

  var _scanStop = function() {
    $timeout.cancel(scanTimer);
    if (localMediaStream && localMediaStream.active) {
      var localMediaStreamTrack = localMediaStream.getTracks();
      for (var i = 0; i < localMediaStreamTrack.length; i++) {
        localMediaStreamTrack[i].stop();
      }
    } else {
      try {
        localMediaStream.stop();
      } catch (e) {
        // Older Chromium not support the STOP function
      };
    }
    localMediaStream = null;
    video.src = '';
  };

  qrcode.callback = function(data) {
    if (prevResult != data) {
      prevResult = data;
      return;
    }
    _scanStop();
    $scope.cancel();
    $scope.onScan({
      data: data
    });
  };

  var _successCallback = function(stream) {
    video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
    localMediaStream = stream;
    video.play();
    $timeout(_scan, 1000);
  };

  var _videoError = function(err) {
    $scope.cancel();
  };

  var setScanner = function() {
    navigator.getUserMedia = navigator.getUserMedia ||
      navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;
    window.URL = window.URL || window.webkitURL ||
      window.mozURL || window.msURL;
  };

  $scope.init = function() {
    setScanner();
    $timeout(function() {
      if ($scope.beforeScan) {
        $scope.beforeScan();
      }
      canvas = document.getElementById('qr-canvas');
      context = canvas.getContext('2d');

      video = document.getElementById('qrcode-scanner-video');
      $video = angular.element(video);
      canvas.width = 300;
      canvas.height = 225;
      context.clearRect(0, 0, 300, 225);

      navigator.getUserMedia({
        video: true
      }, _successCallback, _videoError);
    }, 500);
  };

  $scope.cancel = function() {
    _scanStop();
    $scope.scannerModal.hide();
    $scope.scannerModal.remove();
  };

});

'use strict';

angular.module('copayApp.controllers').controller('searchController', function($scope) {
  var self = $scope.self;
  $scope.search = '';

  $scope.cancel = function() {
    $scope.searchModal.hide();
  };
});

'use strict';

angular.module('copayApp.controllers').controller('txDetailsController', function($rootScope, $log, $scope, $filter, $ionicPopup, gettextCatalog, profileService, configService, lodash) {

  var self = $scope.self;
  var fc = profileService.focusedClient;
  var config = configService.getSync();
  var configWallet = config.wallet;
  var walletSettings = configWallet.settings;

  $scope.alternativeIsoCode = walletSettings.alternativeIsoCode;
  $scope.color = fc.backgroundColor;
  $scope.copayerId = fc.credentials.copayerId;
  $scope.isShared = fc.credentials.n > 1;

  $scope.showCommentPopup = function() {
    $scope.data = {
      comment: $scope.btx.note ? $scope.btx.note.body : '',
    };

    var commentPopup = $ionicPopup.show({
      templateUrl: "views/includes/note.html",
      scope: $scope,
    });

    $scope.commentPopupClose = function() {
      commentPopup.close();
    };

    $scope.commentPopupSave = function() {
      $log.debug('Saving note');
      var args = {
        txid: $scope.btx.txid,
      };

      if (!lodash.isEmpty($scope.data.comment)) {
        args.body = $scope.data.comment;
      };

      fc.editTxNote(args, function(err) {
        if (err) {
          $log.debug('Could not save tx comment');
          return;
        }
        // This is only to refresh the current screen data
        $scope.btx.note = null;
        if (args.body) {
          $scope.btx.note = {};
          $scope.btx.note.body = $scope.data.comment;
          $scope.btx.note.editedByName = fc.credentials.copayerName;
          $scope.btx.note.editedOn = Math.floor(Date.now() / 1000);
        }
        $scope.btx.searcheableString = null;
        commentPopup.close();
      });
    };
  };

  $scope.getAlternativeAmount = function() {
    var satToBtc = 1 / 100000000;

    fc.getFiatRate({
      code: $scope.alternativeIsoCode,
      ts: $scope.btx.time * 1000
    }, function(err, res) {
      if (err) {
        $log.debug('Could not get historic rate');
        return;
      }
      if (res && res.rate) {
        var alternativeAmountBtc = ($scope.btx.amount * satToBtc).toFixed(8);
        $scope.rateDate = res.fetchedOn;
        $scope.rateStr = res.rate + ' ' + $scope.alternativeIsoCode;
        $scope.alternativeAmountStr = $filter('formatFiatAmount')(alternativeAmountBtc * res.rate) + ' ' + $scope.alternativeIsoCode;
        $scope.$apply();
      }
    });
  };

  $scope.getShortNetworkName = function() {
    var n = fc.credentials.network;
    return n.substring(0, 4);
  };

  $scope.copyToClipboard = function(addr, $event) {
    if (!addr) return;
    self.copyToClipboard(addr, $event);
  };

  $scope.cancel = function() {
    $scope.txDetailsModal.hide();
  };

});

'use strict';

angular.module('copayApp.controllers').controller('txpDetailsController', function($scope, $rootScope, $timeout, $interval, $ionicModal, ongoingProcess, platformInfo, txStatus, $ionicScrollDelegate, txFormatService, fingerprintService, bwcError, gettextCatalog, lodash, profileService, walletService, assetService) {
  var self = $scope.self;
  var tx = $scope.tx;
  var copayers = $scope.copayers;
  var isGlidera = $scope.isGlidera;
  var now = Math.floor(Date.now() / 1000);
  var fc = profileService.focusedClient;
  $scope.loading = null;
  $scope.copayerId = fc.credentials.copayerId;
  $scope.isShared = fc.credentials.n > 1;
  $scope.canSign = fc.canSign() || fc.isPrivKeyExternal();
  $scope.color = fc.backgroundColor;

  checkPaypro();

  // ToDo: use tx.customData instead of tx.message
  if (tx.message === 'Glidera transaction' && isGlidera) {
    tx.isGlidera = true;
    if (tx.canBeRemoved) {
      tx.canBeRemoved = (Date.now() / 1000 - (tx.ts || tx.createdOn)) > GLIDERA_LOCK_TIME;
    }
  }

  $scope.sign = function(txp) {
    $scope.error = null;
    $scope.loading = true;

    $timeout(function() {
      fingerprintService.check(fc, function(err) {
        if (err) {
          $scope.error = gettextCatalog.getString('Could not send payment');
          $scope.loading = false;
          $timeout(function() {
            $scope.$digest();
          }, 1);
          return;
        }

        handleEncryptedWallet(function(err) {
          if (err) {
            return setError(err);
          }

          ongoingProcess.set('signingTx', true);
          walletService.signTx(fc, txp, function(err, signedTxp) {
            ongoingProcess.set('signingTx', false);
            walletService.lock(fc);
            if (err) {
              return setError(err);
            }

            if (signedTxp.status == 'accepted') {
              ongoingProcess.set('broadcastingTx', true);
              assetService.broadcastTx(fc, signedTxp, function(err, broadcastedTxp) {
                ongoingProcess.set('broadcastingTx', false);
                $scope.$emit('UpdateTx');
                $scope.close(broadcastedTxp);
                if (err) {
                  return setError(err);
                }
              });
            } else {
              $scope.$emit('UpdateTx');
              $scope.close(signedTxp);
            }
          });
        });
      });
    }, 10);
  };

  function setError(err, prefix) {
    $scope.loading = false;
    $scope.error = bwcError.msg(err, prefix);
    $timeout(function() {
      $scope.$digest();
    }, 10);
  };

  $scope.reject = function(txp) {
    $scope.loading = true;
    $scope.error = null;

    $timeout(function() {
      ongoingProcess.set('rejectTx', true);
      walletService.rejectTx(fc, txp, function(err, txpr) {
        ongoingProcess.set('rejectTx', false);

        if (err) {
          $scope.$emit('UpdateTx');
          return setError(err, gettextCatalog.getString('Could not reject payment'));
        }

        $scope.close(txpr);
      });
    }, 10);
  };

  $scope.remove = function(txp) {
    $scope.loading = true;
    $scope.error = null;

    $timeout(function() {
      ongoingProcess.set('removeTx', true);
      walletService.removeTx(fc, txp, function(err) {
        ongoingProcess.set('removeTx', false);

        // Hacky: request tries to parse an empty response
        if (err && !(err.message && err.message.match(/Unexpected/))) {
          $scope.$emit('UpdateTx');
          return setError(err, gettextCatalog.getString('Could not delete payment proposal'));
        }

        $scope.close();
      });
    }, 10);
  };

  $scope.broadcast = function(txp) {
    $scope.loading = true;
    $scope.error = null;

    $timeout(function() {
      ongoingProcess.set('broadcastTx', true);
      assetService.broadcastTx(fc, txp, function(err, txpb) {
        ongoingProcess.set('broadcastTx', false);

        if (err) {
          return setError(err, gettextCatalog.getString('Could not broadcast payment'));
        }

        $scope.close(txpb);
      });
    }, 10);
  };

  $scope.getShortNetworkName = function() {
    return fc.credentials.networkName.substring(0, 4);
  };

  function checkPaypro() {
    if (tx.payProUrl && !platformInfo.isChromeApp) {
      fc.fetchPayPro({
        payProUrl: tx.payProUrl,
      }, function(err, paypro) {
        if (err) return;
        tx.paypro = paypro;
        paymentTimeControl(tx.paypro.expires);
        $timeout(function() {
          $ionicScrollDelegate.resize();
        }, 100);
      });
    }
  };

  function paymentTimeControl(expirationTime) {
    $scope.paymentExpired = false;
    setExpirationTime();

    self.countDown = $interval(function() {
      setExpirationTime();
    }, 1000);

    function setExpirationTime() {
      var now = Math.floor(Date.now() / 1000);
      if (now > expirationTime) {
        $scope.paymentExpired = true;
        if (self.countDown) $interval.cancel(self.countDown);
        return;
      }
      var totalSecs = expirationTime - now;
      var m = Math.floor(totalSecs / 60);
      var s = totalSecs % 60;
      $scope.expires = ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
    };
  };

  lodash.each(['TxProposalRejectedBy', 'TxProposalAcceptedBy', 'transactionProposalRemoved', 'TxProposalRemoved', 'NewOutgoingTx', 'UpdateTx'], function(eventName) {
    $rootScope.$on(eventName, function() {
      fc.getTx($scope.tx.id, function(err, tx) {
        if (err) {
          if (err.message && err.message == 'TX_NOT_FOUND' &&
            (eventName == 'transactionProposalRemoved' || eventName == 'TxProposalRemoved')) {
            $scope.tx.removed = true;
            $scope.tx.canBeRemoved = false;
            $scope.tx.pendingForUs = false;
            $scope.$apply();
          }
          return;
        }

        var action = lodash.find(tx.actions, {
          copayerId: fc.credentials.copayerId
        });

        $scope.tx = txFormatService.processTx(tx);

        if (!action && tx.status == 'pending')
          $scope.tx.pendingForUs = true;

        $scope.updateCopayerList();
        $scope.$apply();
      });
    });
  });

  $scope.updateCopayerList = function() {
    lodash.map($scope.copayers, function(cp) {
      lodash.each($scope.tx.actions, function(ac) {
        if (cp.id == ac.copayerId) {
          cp.action = ac.type;
        }
      });
    });
  };

  function handleEncryptedWallet(cb) {
    if (!walletService.isEncrypted(fc)) return cb();
    $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
      if (err) return cb(err);
      return cb(walletService.unlock(fc, password));
    });
  };

  $scope.copyToClipboard = function(addr, $event) {
    if (!addr) return;
    self.copyToClipboard(addr, $event);
  };

  $scope.close = function(txp) {
    $scope.loading = null;
    if (txp) {
      var type = txStatus.notify(txp);
      $scope.openStatusModal(type, txp, function() {
        $scope.$emit('Local/TxProposalAction', txp.status == 'broadcasted');
      });
    } else {
      $timeout(function() {
        $scope.$emit('Local/TxProposalAction');
      }, 100);
    }
    $scope.cancel();
  };

  $scope.openStatusModal = function(type, txp, cb) {
    $scope.type = type;
    $scope.tx = txFormatService.processTx(txp);
    $scope.cb = cb;

    $ionicModal.fromTemplateUrl('views/modals/tx-status.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.txStatusModal = modal;
      $scope.txStatusModal.show();
    });
  };

  $scope.cancel = function() {
    $scope.txpDetailsModal.hide();
  };
});

'use strict';

angular.module('copayApp.controllers').controller('txStatusController', function($scope, $timeout) {

  if ($scope.cb) $timeout($scope.cb, 100);

  $scope.cancel = function() {
    $scope.txStatusModal.hide();
  };

});

'use strict';

angular.module('copayApp.controllers').controller('walletsController', function($scope, $timeout, bwcError, profileService) {

  $scope.selectWallet = function(walletId) {

    var client = profileService.getClient(walletId);
    $scope.errorSelectedWallet = {};

    profileService.isReady(client, function(err) {
      if (err) {
        $scope.errorSelectedWallet[walletId] = bwcError.msg(err);
        $timeout(function() {
          $scope.$apply();
        });
        return;
      }

      $scope.$emit('walletSelected', walletId);
    });
  };

  $scope.cancel = function() {
    $scope.walletsModal.hide();
  };

});

angular.module('copayApp.controllers').controller('paperWalletController',
  function($scope, $timeout, $log, $ionicModal, configService, profileService, go, addressService, txStatus, bitcore, ongoingProcess) {

    var fc = profileService.focusedClient;
    var rawTx;

    $scope.onQrCodeScanned = function(data) {
      $scope.inputData = data;
      $scope.onData(data);
    };

    $scope.onData = function(data) {
      $scope.error = null;
      $scope.scannedKey = data;
      $scope.isPkEncrypted = (data.substring(0, 2) == '6P');
    };

    function _scanFunds(cb) {
      function getPrivateKey(scannedKey, isPkEncrypted, passphrase, cb) {
        if (!isPkEncrypted) return cb(null, scannedKey);
        fc.decryptBIP38PrivateKey(scannedKey, passphrase, null, cb);
      };

      function getBalance(privateKey, cb) {
        fc.getBalanceFromPrivateKey(privateKey, cb);
      };

      function checkPrivateKey(privateKey) {
        try {
          new bitcore.PrivateKey(privateKey, 'livenet');
        } catch (err) {
          return false;
        }
        return true;
      };

      getPrivateKey($scope.scannedKey, $scope.isPkEncrypted, $scope.passphrase, function(err, privateKey) {
        if (err) return cb(err);
        if (!checkPrivateKey(privateKey)) return cb(new Error('Invalid private key'));

        getBalance(privateKey, function(err, balance) {
          if (err) return cb(err);
          return cb(null, privateKey, balance);
        });
      });
    };

    $scope.scanFunds = function() {
      $scope.privateKey = '';
      $scope.balanceSat = 0;
      $scope.error = null;

      ongoingProcess.set('scanning', true);
      $timeout(function() {
        _scanFunds(function(err, privateKey, balance) {
          ongoingProcess.set('scanning', false);
          if (err) {
            $log.error(err);
            $scope.error = err.message || err.toString();
          } else {
            $scope.privateKey = privateKey;
            $scope.balanceSat = balance;
            var config = configService.getSync().wallet.settings;
            $scope.balance = profileService.formatAmount(balance) + ' ' + config.unitName;
          }

          $scope.$apply();
        });
      }, 100);
    };

    function _sweepWallet(cb) {
      addressService.getAddress(fc.credentials.walletId, true, function(err, destinationAddress) {
        if (err) return cb(err);

        fc.buildTxFromPrivateKey($scope.privateKey, destinationAddress, null, function(err, tx) {
          if (err) return cb(err);

          fc.broadcastRawTx({
            rawTx: tx.serialize(),
            network: 'livenet'
          }, function(err, txid) {
            if (err) return cb(err);
            return cb(null, destinationAddress, txid);
          });
        });
      });
    };

    $scope.sweepWallet = function() {
      ongoingProcess.set('sweepingWallet', true);
      $scope.sending = true;
      $scope.error = null;

      $timeout(function() {
        _sweepWallet(function(err, destinationAddress, txid) {
          ongoingProcess.set('sweepingWallet', false);

          if (err) {
            $scope.error = err.message || err.toString();
            $log.error(err);
          } else {
            var type = txStatus.notify(txp);
            $scope.openStatusModal(type, txp, function() {
              go.walletHome();
            });
          }
          $scope.$apply();
        });
      }, 100);
    };

    $scope.openStatusModal = function(type, txp, cb) {
      $scope.type = type;
      $scope.tx = txFormatService.processTx(txp);
      $scope.color = fc.backgroundColor;
      $scope.cb = cb;

      $ionicModal.fromTemplateUrl('views/modals/tx-status.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.txStatusModal = modal;
        $scope.txStatusModal.show();
      });
    };

  });

'use strict';
angular.module('copayApp.controllers').controller('paymentUriController',
  function($rootScope, $scope, $stateParams, $location, $timeout, profileService, configService, lodash, bitcore, go) {
    function strip(number) {
      return (parseFloat(number.toPrecision(12)));
    };

    // Build bitcoinURI with querystring
    this.init = function() {
      var query = [];
      this.bitcoinURI = $stateParams.url;

      var URI = bitcore.URI;
      var isUriValid = URI.isValid(this.bitcoinURI);
      if (!URI.isValid(this.bitcoinURI)) {
        this.error = true;
        return;
      }
      var uri = new URI(this.bitcoinURI);

      if (uri && uri.address) {
        var config = configService.getSync().wallet.settings;
        var unitToSatoshi = config.unitToSatoshi;
        var satToUnit = 1 / unitToSatoshi;
        var unitName = config.unitName;

        if (uri.amount) {
          uri.amount = strip(uri.amount * satToUnit) + ' ' + unitName;
        }
        uri.network = uri.address.network.name;
        this.uri = uri;
      }
    };

    this.getWallets = function(network) {

      $scope.wallets = [];
      lodash.forEach(profileService.getWallets(network), function(w) {
        var client = profileService.getClient(w.id);
        profileService.isReady(client, function(err) {
          if (err) return;
          $scope.wallets.push(w);
        })
      });
    };

    this.selectWallet = function(wid) {
      var self = this;
      profileService.setAndStoreFocus(wid, function() {});
      go.walletHome();
      $timeout(function() {
        $rootScope.$emit('paymentUri', self.bitcoinURI);
      }, 1000);
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesController',
  function($scope, $rootScope, $timeout, $log, configService, profileService, fingerprintService, walletService) {

    var fc;
    var config = configService.getSync();

    var disableFocusListener = $rootScope.$on('Local/NewFocusedWalletReady', function() {
      $scope.init();
    });

    $scope.$on('$destroy', function() {
      disableFocusListener();
    });

    $scope.init = function() {
      $scope.externalSource = null;

      fc = profileService.focusedClient;
      if (fc) {
        $scope.encryptEnabled = walletService.isEncrypted(fc);
        if (fc.isPrivKeyExternal)
          $scope.externalSource = fc.getPrivKeyExternalSourceName() == 'ledger' ? 'Ledger' : 'Trezor';

        // TODO externalAccount
        //this.externalIndex = fc.getExternalIndex();
      }

      $scope.touchidAvailable = fingerprintService.isAvailable();
      $scope.touchidEnabled = config.touchIdFor ? config.touchIdFor[fc.credentials.walletId] : null;

      $scope.deleted = false;
      if (fc.credentials && !fc.credentials.mnemonicEncrypted && !fc.credentials.mnemonic) {
        $scope.deleted = true;
      }
    };

    var handleEncryptedWallet = function(cb) {
      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(fc, password));
      });
    };

    $scope.encryptChange = function() {
      if (!fc) return;
      var val = $scope.encryptEnabled;

      var setPrivateKeyEncryption = function(password, cb) {
        $log.debug('Encrypting private key for', fc.credentials.walletName);

        fc.setPrivateKeyEncryption(password);
        fc.lock();
        profileService.updateCredentials(JSON.parse(fc.export()), function() {
          $log.debug('Wallet encrypted');
          return cb();
        });
      };

      var disablePrivateKeyEncryption = function(cb) {
        $log.debug('Disabling private key encryption for', fc.credentials.walletName);

        try {
          fc.disablePrivateKeyEncryption();
        } catch (e) {
          return cb(e);
        }
        profileService.updateCredentials(JSON.parse(fc.export()), function() {
          $log.debug('Wallet encryption disabled');
          return cb();
        });
      };

      if (val && !walletService.isEncrypted(fc)) {
        $rootScope.$emit('Local/NeedsPassword', true, function(err, password) {
          if (err || !password) {
            $scope.encryptEnabled = false;
            return;
          }
          setPrivateKeyEncryption(password, function() {
            $rootScope.$emit('Local/NewEncryptionSetting');
            $scope.encryptEnabled = true;
          });
        });
      } else {
        if (!val && walletService.isEncrypted(fc)) {
          handleEncryptedWallet(function(err) {
            if (err) {
              $scope.encryptEnabled = true;
              return;
            }
            disablePrivateKeyEncryption(function(err) {
              $rootScope.$emit('Local/NewEncryptionSetting');
              if (err) {
                $scope.encryptEnabled = true;
                $log.error(err);
                return;
              }
              $scope.encryptEnabled = false;
            });
          });
        }
      }
    };

    $scope.touchidChange = function() {
      var walletId = fc.credentials.walletId;

      var opts = {
        touchIdFor: {}
      };
      opts.touchIdFor[walletId] = $scope.touchidEnabled;

      fingerprintService.check(fc, function(err) {
        if (err) {
          $log.debug(err);
          $timeout(function() {
            $scope.touchidError = true;
            $scope.touchidEnabled = true;
          }, 100);
          return;
        }
        configService.set(opts, function(err) {
          if (err) {
            $log.debug(err);
            $scope.touchidError = true;
            $scope.touchidEnabled = false;
          }
        });
      });
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesAbout',
  function() {});

'use strict';

angular.module('copayApp.controllers').controller('preferencesAliasController',
  function($scope, $timeout, configService, profileService, go) {
    var fc = profileService.focusedClient;
    var walletId = fc.credentials.walletId;
    var config = configService.getSync();

    config.aliasFor = config.aliasFor || {};
    $scope.alias = config.aliasFor[walletId] || fc.credentials.walletName;

    $scope.save = function() {
      var opts = {
        aliasFor: {}
      };
      opts.aliasFor[walletId] = $scope.alias;

      configService.set(opts, function(err) {
        if (err) {
          $scope.$emit('Local/DeviceError', err);
          return;
        }
        $scope.$emit('Local/AliasUpdated');
        $timeout(function() {
          go.path('preferences');
        }, 50);
      });
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesAltCurrencyController',
  function($scope, $log, $timeout, configService, rateService, lodash, go, profileService, walletService) {

    var config = configService.getSync();
    var next = 10;
    var completeAlternativeList;
    $scope.currentCurrency = config.wallet.settings.alternativeIsoCode;
    $scope.listComplete = false;

    $scope.init = function() {
      rateService.whenAvailable(function() {
        completeAlternativeList = rateService.listAlternatives();
        lodash.remove(completeAlternativeList, function(c) {
          return c.isoCode == 'BTC';
        });
        $scope.altCurrencyList = completeAlternativeList.slice(0, next);
      });
    };

    $scope.loadMore = function() {
      $timeout(function() {
        $scope.altCurrencyList = completeAlternativeList.slice(0, next);
        next += 10;
        $scope.listComplete = $scope.altCurrencyList.length >= completeAlternativeList.length;
        $scope.$broadcast('scroll.infiniteScrollComplete');
      }, 100);
    };

    $scope.save = function(newAltCurrency) {
      var opts = {
        wallet: {
          settings: {
            alternativeName: newAltCurrency.name,
            alternativeIsoCode: newAltCurrency.isoCode,
          }
        }
      };

      configService.set(opts, function(err) {
        if (err) $log.warn(err);
        go.preferencesGlobal();
        $scope.$emit('Local/UnitSettingUpdated');
        walletService.updateRemotePreferences(profileService.getClients(), {}, function() {
          $log.debug('Remote preferences saved');
        });
      });
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesBwsUrlController',
  function($scope, $log, configService, applicationService, profileService, storageService) {
    $scope.error = null;
    $scope.success = null;

    var fc = profileService.focusedClient;
    var walletId = fc.credentials.walletId;
    var defaults = configService.getDefaults();
    var config = configService.getSync();

    $scope.bwsurl = (config.bwsFor && config.bwsFor[walletId]) || defaults.bws.url;

    $scope.resetDefaultUrl = function() {
      $scope.bwsurl = defaults.bws.url;
    };

    $scope.save = function() {

      var bws;
      switch ($scope.bwsurl) {
        case 'prod':
        case 'production':
          bws = 'https://bws.bitpay.com/bws/api'
          break;
        case 'sta':
        case 'staging':
          bws = 'https://bws-staging.b-pay.net/bws/api'
          break;
        case 'loc':
        case 'local':
          bws = 'http://localhost:3232/bws/api'
          break;
      };
      if (bws) {
        $log.info('Using BWS URL Alias to ' + bws);
        $scope.bwsurl = bws;
      }

      var opts = {
        bwsFor: {}
      };
      opts.bwsFor[walletId] = $scope.bwsurl;

      configService.set(opts, function(err) {
        if (err) $log.debug(err);
        storageService.setCleanAndScanAddresses(walletId, function() {
          applicationService.restart();
        });
      });
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesCoinbaseController',
  function($scope, $timeout, $ionicModal, applicationService, coinbaseService) {

    this.revokeToken = function(testnet) {
      $scope.network = testnet ? 'testnet' : 'livenet';

      $ionicModal.fromTemplateUrl('views/modals/coinbase-confirmation.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.coinbaseConfirmationModal = modal;
        $scope.coinbaseConfirmationModal.show();
      });
    };

  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesColorController', function($scope, $log, configService, profileService, go) {

  $scope.colorList = [
        '#DD4B39',
        '#F38F12',
        '#FAA77F',
        '#D0B136',
        '#9EDD72',
        '#29BB9C',
        '#019477',
        '#77DADA',
        '#4A90E2',
        '#484ED3',
        '#9B59B6',
        '#E856EF',
        '#FF599E',
        '#7A8C9E',
      ];

  var fc = profileService.focusedClient;
  var walletId = fc.credentials.walletId;
  var config = configService.getSync();
  config.colorFor = config.colorFor || {};

  $scope.currentColor = config.colorFor[walletId] || '#4A90E2';

  $scope.save = function(color) {
    var opts = {
      colorFor: {}
    };
    opts.colorFor[walletId] = color;

    configService.set(opts, function(err) {
      go.preferences();
      if (err) $log.warn(err);
      $scope.$emit('Local/ColorUpdated');
    });
  };
});

'use strict';

angular.module('copayApp.controllers').controller('preferencesDeleteWalletController',
  function($scope, $rootScope, $filter, $timeout, $log, $ionicModal, storageService, notification, profileService, platformInfo, go, gettext, gettextCatalog, applicationService, ongoingProcess) {
    var isCordova = platformInfo.isCordova;
    $scope.isCordova = isCordova;
    $scope.error = null;

    var delete_msg = gettextCatalog.getString('Are you sure you want to delete this wallet?');
    var accept_msg = gettextCatalog.getString('Accept');
    var cancel_msg = gettextCatalog.getString('Cancel');
    var confirm_msg = gettextCatalog.getString('Confirm');

    var _modalDeleteWallet = function() {
      $scope.title = delete_msg;
      $scope.accept_msg = accept_msg;
      $scope.cancel_msg = cancel_msg;
      $scope.confirm_msg = confirm_msg;
      $scope.okAction = doDeleteWallet;
      $scope.loading = false;

      $ionicModal.fromTemplateUrl('views/modals/confirmation.html', {
        scope: $scope
      }).then(function(modal) {
        $scope.confirmationModal = modal;
        $scope.confirmationModal.show();
      });
    };

    var doDeleteWallet = function() {
      ongoingProcess.set('deletingWallet', true);
      var fc = profileService.focusedClient;
      var name = fc.credentials.walletName;
      var walletName = (fc.alias || '') + ' [' + name + ']';

      profileService.deleteWalletClient(fc, function(err) {
        ongoingProcess.set('deletingWallet', false);
        if (err) {
          $scope.error = err.message || err;
        } else {
          go.walletHome();
          notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('The wallet "{{walletName}}" was deleted', {
            walletName: walletName
          }));
        }
      });
    };

    $scope.deleteWallet = function() {
      if (isCordova) {
        navigator.notification.confirm(
          delete_msg,
          function(buttonIndex) {
            if (buttonIndex == 1) {
              doDeleteWallet();
            }
          },
          confirm_msg, [accept_msg, cancel_msg]
        );
      } else {
        _modalDeleteWallet();
      }
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesDeleteWordsController', function($scope, confirmDialog, lodash, notification, profileService, go, gettext) {
  var fc = profileService.focusedClient;
  var msg = gettext('Are you sure you want to delete the recovery phrase?');
  var successMsg = gettext('Recovery phrase deleted');

  if (lodash.isEmpty(fc.credentials.mnemonic) && lodash.isEmpty(fc.credentials.mnemonicEncrypted))
    $scope.deleted = true;

  $scope.delete = function() {
    confirmDialog.show(msg, function(ok) {
      if (ok) {
        fc.clearMnemonic();
        profileService.updateCredentials(JSON.parse(fc.export()), function() {
          notification.success(successMsg);
          go.walletHome();
        });
      }
    });
  };
});

'use strict';

angular.module('copayApp.controllers').controller('preferencesEmailController', function($rootScope, $scope, go, profileService, walletService) {
  $scope.save = function(form) {
    $scope.error = null;
    $scope.saving = true;
    var fc = profileService.focusedClient;
    var email = $scope.email || '';

    walletService.updateRemotePreferences(fc, {
      email: email,
    }, function(err) {
      $scope.saving = false;
      if (!err)
        $rootScope.$emit('Local/EmailUpdated', email);
      go.path('preferences');
    });
  };
});

'use strict';

angular.module('copayApp.controllers').controller('preferencesFeeController', function($scope, $timeout, configService, feeService) {

  $scope.loading = true;
  feeService.getFeeLevels(function(levels) {
    $scope.loading = false;
    $scope.feeOpts = feeService.feeOpts;
    $scope.currentFeeLevel = feeService.getCurrentFeeLevel();
    $scope.feeLevels = levels;
    $scope.$apply();
  });

  $scope.save = function(newFee) {
    var opts = {
      wallet: {
        settings: {
          feeLevel: newFee.level
        }
      }
    };

    configService.set(opts, function(err) {
      if (err) $log.debug(err);
      $scope.currentFeeLevel = newFee.level;
      $timeout(function() {
        $scope.$apply();
      }, 10);
    });
  };
});

'use strict';

angular.module('copayApp.controllers').controller('preferencesGlideraController',
  function($scope, $timeout, $ionicModal, profileService, applicationService, glideraService, storageService) {

    this.getEmail = function(token) {
      var self = this;
      glideraService.getEmail(token, function(error, data) {
        self.email = data;
      });
    };

    this.getPersonalInfo = function(token) {
      var self = this;
      glideraService.getPersonalInfo(token, function(error, info) {
        self.personalInfo = info;
      });
    };

    this.getStatus = function(token) {
      var self = this;
      glideraService.getStatus(token, function(error, data) {
        self.status = data;
      });
    };

    this.getLimits = function(token) {
      var self = this;
      glideraService.getLimits(token, function(error, limits) {
        self.limits = limits;
      });
    };

    this.revokeToken = function(testnet) {
      $scope.network = testnet ? 'testnet' : 'livenet';
      $scope.loading = false;

      $ionicModal.fromTemplateUrl('views/modals/glidera-confirmation.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.glideraConfirmationModal = modal;
        $scope.glideraConfirmationModal.show();
      });
    };

  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesGlobalController',
  function($scope, $rootScope, $log, configService, uxLanguage, platformInfo, pushNotificationsService, profileService, feeService) {

    var isCordova = platformInfo.isCordova;

    if (isCordova && StatusBar.isVisible) {
      StatusBar.backgroundColorByHexString("#4B6178");
    }

    $scope.init = function() {
      var config = configService.getSync();
      $scope.unitName = config.wallet.settings.unitName;
      $scope.currentLanguageName = uxLanguage.getCurrentLanguageName();
      $scope.selectedAlternative = {
        name: config.wallet.settings.alternativeName,
        isoCode: config.wallet.settings.alternativeIsoCode
      };
      $scope.feeOpts = feeService.feeOpts;
      $scope.currentFeeLevel = feeService.getCurrentFeeLevel();
      $scope.usePushNotifications = isCordova && !platformInfo.isWP;
      $scope.PNEnabledByUser = true;
      $scope.isIOSApp = platformInfo.isIOS && isCordova;
      if ($scope.isIOSApp) {
        cordova.plugins.diagnostic.isRemoteNotificationsEnabled(function(isEnabled) {
          $scope.PNEnabledByUser = isEnabled;
          $scope.$digest();
        });
      }
      $scope.spendUnconfirmed = config.wallet.spendUnconfirmed;
      $scope.glideraEnabled = config.glidera.enabled;
      $scope.coinbaseEnabled = config.coinbase.enabled;
      $scope.pushNotifications = config.pushNotifications.enabled;
    };

    $scope.openSettings = function() {
      cordova.plugins.diagnostic.switchToSettings(function() {
        $log.debug('switched to settings');
      }, function(err) {
        $log.debug(err);
      });
    }

    $scope.spendUnconfirmedChange = function() {
      var opts = {
        wallet: {
          spendUnconfirmed: $scope.spendUnconfirmed
        }
      };
      configService.set(opts, function(err) {
        $rootScope.$emit('Local/SpendUnconfirmedUpdated', $scope.spendUnconfirmed);
        if (err) $log.debug(err);
      });
    };

    $scope.pushNotificationsChange = function() {
      var opts = {
        pushNotifications: {
          enabled: $scope.pushNotifications
        }
      };
      configService.set(opts, function(err) {
        if (opts.pushNotifications.enabled)
          pushNotificationsService.enableNotifications(profileService.walletClients);
        else
          pushNotificationsService.disableNotifications(profileService.walletClients);
        if (err) $log.debug(err);
      });
    };

    $scope.glideraChange = function() {
      var opts = {
        glidera: {
          enabled: $scope.glideraEnabled
        }
      };
      configService.set(opts, function(err) {
        $rootScope.$emit('Local/GlideraUpdated');
        if (err) $log.debug(err);
      });
    };

    $scope.coinbaseChange = function() {
      var opts = {
        coinbase: {
          enabled: $scope.coinbaseEnabled
        }
      };
      configService.set(opts, function(err) {
        $rootScope.$emit('Local/CoinbaseUpdated');
        if (err) $log.debug(err);
      });
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesHistory',
  function($scope, $log, $timeout, storageService, go, profileService, lodash) {
    var fc = profileService.focusedClient;
    var c = fc.credentials;
    $scope.csvReady = false;

    $scope.csvHistory = function(cb) {
      var allTxs = [];

      function getHistory(cb) {
        storageService.getTxHistory(c.walletId, function(err, txs) {
          if (err) return cb(err);

          var txsFromLocal = [];
          try {
            txsFromLocal = JSON.parse(txs);
          } catch (ex) {
            $log.warn(ex);
          }

          allTxs.push(txsFromLocal);
          return cb(null, lodash.flatten(allTxs));
        });
      };

      $log.debug('Generating CSV from History');
      getHistory(function(err, txs) {
        if (err || !txs) {
          $log.warn('Failed to generate CSV:', err);
          if (cb) return cb(err);
          return;
        }

        $log.debug('Wallet Transaction History Length:', txs.length);

        $scope.satToUnit = 1 / $scope.unitToSatoshi;
        var data = txs;
        var satToBtc = 1 / 100000000;
        $scope.csvContent = [];
        $scope.csvFilename = 'Copay-' + ($scope.alias || $scope.walletName) + '.csv';
        $scope.csvHeader = ['Date', 'Destination', 'Description', 'Amount', 'Currency', 'Txid', 'Creator', 'Copayers', 'Comment'];

        var _amount, _note, _copayers, _creator, _comment;
        data.forEach(function(it, index) {
          var amount = it.amount;

          if (it.action == 'moved')
            amount = 0;

          _copayers = '';
          _creator = '';

          if (it.actions && it.actions.length > 1) {
            for (var i = 0; i < it.actions.length; i++) {
              _copayers += it.actions[i].copayerName + ':' + it.actions[i].type + ' - ';
            }
            _creator = (it.creatorName && it.creatorName != 'undefined') ? it.creatorName : '';
          }
          _amount = (it.action == 'sent' ? '-' : '') + (amount * satToBtc).toFixed(8);
          _note = it.message || '';
          _comment = it.note ? it.note.body : '';

          if (it.action == 'moved')
            _note += ' Moved:' + (it.amount * satToBtc).toFixed(8)

          $scope.csvContent.push({
            'Date': formatDate(it.time * 1000),
            'Destination': it.addressTo || '',
            'Description': _note,
            'Amount': _amount,
            'Currency': 'BTC',
            'Txid': it.txid,
            'Creator': _creator,
            'Copayers': _copayers,
            'Comment': _comment
          });

          if (it.fees && (it.action == 'moved' || it.action == 'sent')) {
            var _fee = (it.fees * satToBtc).toFixed(8)
            $scope.csvContent.push({
              'Date': formatDate(it.time * 1000),
              'Destination': 'Bitcoin Network Fees',
              'Description': '',
              'Amount': '-' + _fee,
              'Currency': 'BTC',
              'Txid': '',
              'Creator': '',
              'Copayers': ''
            });
          }
        });

        $scope.csvReady = true;
        $timeout(function() {
          $scope.$apply();
        }, 100);

        if (cb)
          return cb();
        return;
      });

      function formatDate(date) {
        var dateObj = new Date(date);
        if (!dateObj) {
          $log.debug('Error formating a date');
          return 'DateError'
        }
        if (!dateObj.toJSON()) {
          return '';
        }

        return dateObj.toJSON();
      };
    };

    $scope.clearTransactionHistory = function() {
      storageService.removeTxHistory(c.walletId, function(err) {
        if (err) {
          $log.error(err);
          return;
        }
        $scope.$emit('Local/ClearHistory');

        $timeout(function() {
          go.walletHome();
        }, 100);
      });
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesInformation',
  function($scope, $log, $timeout, platformInfo, gettextCatalog, lodash, profileService, configService, go) {
    var base = 'xpub';
    var fc = profileService.focusedClient;
    var c = fc.credentials;
    var walletId = c.walletId;
    var config = configService.getSync();
    var b = 1;
    var isCordova = platformInfo.isCordova;
    config.colorFor = config.colorFor || {};

    $scope.init = function() {
      var basePath = c.getBaseAddressDerivationPath();

      $scope.walletName = c.walletName;
      $scope.walletId = c.walletId;
      $scope.network = c.network;
      $scope.addressType = c.addressType || 'P2SH';
      $scope.derivationStrategy = c.derivationStrategy || 'BIP45';
      $scope.basePath = basePath;
      $scope.M = c.m;
      $scope.N = c.n;
      $scope.pubKeys = lodash.pluck(c.publicKeyRing, 'xPubKey');
      $scope.addrs = null;

      fc.getMainAddresses({
        doNotVerify: true
      }, function(err, addrs) {
        if (err) {
          $log.warn(err);
          return;
        };
        var last10 = [],
          i = 0,
          e = addrs.pop();
        while (i++ < 10 && e) {
          e.path = base + e.path.substring(1);
          last10.push(e);
          e = addrs.pop();
        }
        $scope.addrs = last10;
        $timeout(function() {
          $scope.$apply();
        });

      });
    };

    $scope.sendAddrs = function() {
      function formatDate(ts) {
        var dateObj = new Date(ts * 1000);
        if (!dateObj) {
          $log.debug('Error formating a date');
          return 'DateError';
        }
        if (!dateObj.toJSON()) {
          return '';
        }
        return dateObj.toJSON();
      };

      $timeout(function() {
        fc.getMainAddresses({
          doNotVerify: true
        }, function(err, addrs) {
          if (err) {
            $log.warn(err);
            return;
          };

          var body = 'ColuWallet Wallet "' + $scope.walletName + '" Addresses\n  Only Main Addresses are  shown.\n\n';
          body += "\n";
          body += addrs.map(function(v) {
            return ('* ' + v.address + ' ' + base + v.path.substring(1) + ' ' + formatDate(v.createdOn));
          }).join("\n");

          window.plugins.socialsharing.shareViaEmail(
            body,
            'ColuWallet Addresses',
            null, // TO: must be null or an array
            null, // CC: must be null or an array
            null, // BCC: must be null or an array
            null, // FILES: can be null, a string, or an array
            function() {},
            function() {}
          );

          $timeout(function() {
            $scope.$apply();
          }, 1000);
        });
      }, 100);
    };

    $scope.saveBlack = function() {
      function save(color) {
        var opts = {
          colorFor: {}
        };
        opts.colorFor[walletId] = color;

        configService.set(opts, function(err) {
          go.walletHome();
          if (err) $log.warn(err);
          $scope.$emit('Local/ColorUpdated');
        });
      };

      if (b != 5) return b++;
      save('#202020');
    };

    $scope.copyToClipboard = function(data) {
      if (isCordova) {
        window.cordova.plugins.clipboard.copy(data);
        window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      }
    };

  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesLanguageController',
  function($scope, $log, configService, profileService, uxLanguage, walletService, go) {

    $scope.availableLanguages = uxLanguage.getLanguages();
    $scope.currentLanguage = uxLanguage.getCurrentLanguage();

    $scope.save = function(newLang) {
      var opts = {
        wallet: {
          settings: {
            defaultLanguage: newLang
          }
        }
      };

      configService.set(opts, function(err) {
        if (err) $log.warn(err);
        go.preferencesGlobal();

        uxLanguage.update(function() {
          walletService.updateRemotePreferences(profileService.getClients(), {}, function() {
            $log.debug('Remote preferences saved');
          });
        });
      });
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('preferencesLogs',
function(historicLog) {
  this.logs = historicLog.get();

  this.sendLogs = function() {
    var body = 'Copay Session Logs\n Be careful, this could contain sensitive private data\n\n';
    body += '\n\n';
    body += this.logs.map(function(v) {
      return v.msg;
    }).join('\n');

    window.plugins.socialsharing.shareViaEmail(
      body,
      'Copay Logs',
      null, // TO: must be null or an array
      null, // CC: must be null or an array
      null, // BCC: must be null or an array
      null, // FILES: can be null, a string, or an array
      function() {},
      function() {}
    );
  };
});

'use strict';

angular.module('copayApp.controllers').controller('preferencesUnitController', function($scope, $log, configService, go, walletService, profileService) {

  var config = configService.getSync();

  $scope.currentUnit = config.wallet.settings.unitCode;

  $scope.unitList = [
    {
      name: 'bits (1,000,000 bits = 1BTC)',
      shortName: 'bits',
      value: 100,
      decimals: 2,
      code: 'bit',
    },
    {
      name: 'BTC',
      shortName: 'BTC',
      value: 100000000,
      decimals: 8,
      code: 'btc',
    }
  ];

  $scope.save = function(newUnit) {
    var opts = {
      wallet: {
        settings: {
          unitName: newUnit.shortName,
          unitToSatoshi: newUnit.value,
          unitDecimals: newUnit.decimals,
          unitCode: newUnit.code,
        }
      }
    };

    configService.set(opts, function(err) {
      if (err) $log.warn(err);

      go.preferencesGlobal();
      $scope.$emit('Local/UnitSettingUpdated');

      walletService.updateRemotePreferences(profileService.getClients(), {}, function() {
        $log.debug('Remote preferences saved');
      });
    });
  };
});

'use strict';

angular.module('copayApp.controllers').controller('sellCoinbaseController',
  function($rootScope, $scope, $log, $timeout, $ionicModal, lodash, profileService, coinbaseService, configService, walletService, fingerprintService, ongoingProcess, go) {

    var self = this;
    var client;

    $scope.priceSensitivity = [
      {
        value: 0.5,
        name: '0.5%'
      },
      {
        value: 1,
        name: '1%'
      },
      {
        value: 2,
        name: '2%'
      },
      {
        value: 5,
        name: '5%'
      },
      {
        value: 10,
        name: '10%'
      }
    ];
    $scope.selectedPriceSensitivity = $scope.priceSensitivity[1];

    var handleEncryptedWallet = function(client, cb) {
      if (!walletService.isEncrypted(client)) return cb();
      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(client, password));
      });
    };

    this.init = function(testnet) {
      self.allWallets = profileService.getWallets(testnet ? 'testnet' : 'livenet', 1);

      client = profileService.focusedClient;
      if (client && client.credentials.m == 1) {
        $timeout(function() {
          self.selectedWalletId = client.credentials.walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
      }
    };

    this.getPaymentMethods = function(token) {
      coinbaseService.getPaymentMethods(token, function(err, p) {
        if (err) {
          self.error = err;
          return;
        }
        self.paymentMethods = [];
        lodash.each(p.data, function(pm) {
          if (pm.allow_sell) {
            self.paymentMethods.push(pm);
          }
          if (pm.allow_sell && pm.primary_sell) {
            $scope.selectedPaymentMethod = pm;
          }
        });
      });
    };

    this.getPrice = function(token) {
      var currency = 'USD';
      coinbaseService.sellPrice(token, currency, function(err, s) {
        if (err) return;
        self.sellPrice = s.data || null;
      });
    };

    $scope.openWalletsModal = function(wallets) {
      self.error = null;

      $scope.type = 'SELL';
      $scope.wallets = wallets;
      $scope.noColor = true;
      $scope.self = self;

      $ionicModal.fromTemplateUrl('views/modals/wallets.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.walletsModal = modal;
        $scope.walletsModal.show();
      });

      $scope.$on('walletSelected', function(ev, walletId) {
        $timeout(function() {
          client = profileService.getClient(walletId);
          self.selectedWalletId = walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
        $scope.walletsModal.hide();
      });
    };

    this.depositFunds = function(token, account) {
      self.error = null;
      if ($scope.amount) {
        this.createTx(token, account, $scope.amount)
      } else if ($scope.fiat) {
        var btcValue = ($scope.fiat / self.sellPrice.amount).toFixed(8);
        this.createTx(token, account, btcValue);
      }
    };

    this.sellRequest = function(token, account, ctx) {
      self.error = null;
      if (!ctx.amount) return;
      var accountId = account.id;
      var data = ctx.amount;
      data['payment_method'] = $scope.selectedPaymentMethod.id || null;
      ongoingProcess.set('Sending request...', true);
      coinbaseService.sellRequest(token, accountId, data, function(err, sell) {
        ongoingProcess.set('Sending request...', false);
        if (err) {
          self.error = err;
          return;
        }
        self.sellInfo = sell.data;
      });
    };

    this.confirmSell = function(token, account, sell) {
      self.error = null;
      var accountId = account.id;
      var sellId = sell.id;
      ongoingProcess.set('Selling Bitcoin...', true);
      coinbaseService.sellCommit(token, accountId, sellId, function(err, data) {
        ongoingProcess.set('Selling Bitcoin...', false);
        if (err) {
          self.error = err;
          return;
        }
        self.success = data.data;
        $scope.$emit('Local/CoinbaseTx');
      });
    };

    this.createTx = function(token, account, amount) {
      self.error = null;

      if (!client) {
        self.error = 'No wallet selected';
        return;
      }

      var accountId = account.id;
      var dataSrc = {
        name: 'Received from Copay: ' + self.selectedWalletName
      };
      var outputs = [];
      var config = configService.getSync();
      var configWallet = config.wallet;
      var walletSettings = configWallet.settings;


      ongoingProcess.set('Creating Transaction...', true);
      $timeout(function() {

        coinbaseService.createAddress(token, accountId, dataSrc, function(err, data) {
          if (err) {
            ongoingProcess.set('Creating Transaction...', false);
            self.error = err;
            return;
          }

          var address, comment;

          address = data.data.address;
          amount = parseInt((amount * 100000000).toFixed(0));
          comment = 'Send funds to Coinbase Account: ' + account.name;

          outputs.push({
            'toAddress': address,
            'amount': amount,
            'message': comment
          });

          var txp = {
            toAddress: address,
            amount: amount,
            outputs: outputs,
            message: comment,
            payProUrl: null,
            excludeUnconfirmedUtxos: configWallet.spendUnconfirmed ? false : true,
            feeLevel: walletSettings.feeLevel || 'normal'
          };

          walletService.createTx(client, txp, function(err, createdTxp) {
            if (err) {
              $log.debug(err);
              ongoingProcess.set('Creating Transaction...', false);
              self.error = {
                errors: [{
                  message: 'Could not create transaction: ' + err.message
                }]
              };
              $scope.$apply();
              return;
            }
            ongoingProcess.set('Creating Transaction...', false);
            $scope.$emit('Local/NeedsConfirmation', createdTxp, function(accept) {
              if (accept) {
                self.confirmTx(createdTxp, function(err, tx) {
                  ongoingProcess.clear();
                  if (err) {
                    self.error = {
                      errors: [{
                        message: 'Could not create transaction: ' + err.message
                      }]
                    };
                    return;
                  }
                  ongoingProcess.set('Checking Transaction...', false);
                  coinbaseService.getTransactions(token, accountId, function(err, ctxs) {
                    if (err) {
                      $log.debug(err);
                      return;
                    }
                    lodash.each(ctxs.data, function(ctx) {
                      if (ctx.type == 'send' && ctx.from) {
                        ongoingProcess.clear();
                        if (ctx.status == 'completed') {
                          self.sellRequest(token, account, ctx);
                        } else {
                          // Save to localstorage
                          ctx['price_sensitivity'] = $scope.selectedPriceSensitivity;
                          ctx['sell_price_amount'] = self.sellPrice ? self.sellPrice.amount : '';
                          ctx['sell_price_currency'] = self.sellPrice ? self.sellPrice.currency : 'USD';
                          ctx['description'] = 'Copay Wallet: ' + client.credentials.walletName;
                          coinbaseService.savePendingTransaction(ctx, null, function(err) {
                            if (err) $log.debug(err);
                            self.sendInfo = ctx;
                            $timeout(function() {
                              $scope.$emit('Local/CoinbaseTx');
                            }, 1000);
                          });
                        }
                        return false;
                      }
                    });
                  });
                });
              } else {
                go.path('coinbase');
              }
            });
          });
        });
      }, 100);
    };

    this.confirmTx = function(txp, cb) {

      fingerprintService.check(client, function(err) {
        if (err) {
          $log.debug(err);
          return cb(err);
        }

        handleEncryptedWallet(client, function(err) {
          if (err) {
            $log.debug(err);
            return cb(err);
          }

          ongoingProcess.set('Sending Bitcoin to Coinbase...', true);
          walletService.publishTx(client, txp, function(err, publishedTxp) {
            if (err) {
              ongoingProcess.set('Sending Bitcoin to Coinbase...', false);
              $log.debug(err);
              return cb({
                errors: [{
                  message: 'Transaction could not be published: ' + err.message
                }]
              });
            }

            walletService.signTx(client, publishedTxp, function(err, signedTxp) {
              walletService.lock(client);
              if (err) {
                ongoingProcess.set('Sending Bitcoin to Coinbase...', false);
                $log.debug(err);
                walletService.removeTx(client, signedTxp, function(err) {
                  if (err) $log.debug(err);
                });
                return cb({
                  errors: [{
                    message: 'The payment was created but could not be completed: ' + err.message
                  }]
                });
              }

              walletService.broadcastTx(client, signedTxp, function(err, broadcastedTxp) {
                if (err) {
                  ongoingProcess.set('Sending Bitcoin to Coinbase...', false);
                  $log.debug(err);
                  walletService.removeTx(client, broadcastedTxp, function(err) {
                    if (err) $log.debug(err);
                  });
                  return cb({
                    errors: [{
                      message: 'The payment was created but could not be broadcasted: ' + err.message
                    }]
                  });
                }
                $timeout(function() {
                  return cb(null, broadcastedTxp);
                }, 5000);
              });
            });
          });
        });
      });
    };

  });

'use strict';

angular.module('copayApp.controllers').controller('sellGlideraController',
  function($rootScope, $scope, $timeout, $ionicModal, $log, configService, profileService, addressService, feeService, glideraService, bwcError, lodash, walletService, fingerprintService, ongoingProcess, go) {

    var self = this;
    var config = configService.getSync();
    this.data = {};
    this.show2faCodeInput = null;
    this.success = null;
    this.error = null;
    var client;

    var handleEncryptedWallet = function(client, cb) {
      if (!walletService.isEncrypted(client)) return cb();
      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(client, password));
      });
    };

    this.init = function(testnet) {
      self.allWallets = profileService.getWallets(testnet ? 'testnet' : 'livenet', 1);

      client = profileService.focusedClient;
      if (client && client.credentials.m == 1) {
        $timeout(function() {
          self.selectedWalletId = client.credentials.walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
      }
    };



    $scope.openWalletsModal = function(wallets) {
      self.error = null;

      $scope.type = 'SELL';
      $scope.wallets = wallets;
      $scope.noColor = true;
      $scope.self = self;

      $ionicModal.fromTemplateUrl('views/modals/wallets.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.walletsModal = modal;
        $scope.walletsModal.show();
      });

      $scope.$on('walletSelected', function(ev, walletId) {
        $timeout(function() {
          client = profileService.getClient(walletId);
          self.selectedWalletId = walletId;
          self.selectedWalletName = client.credentials.walletName;
          $scope.$apply();
        }, 100);
        $scope.walletsModal.hide();
      });
    };

    this.getSellPrice = function(token, price) {
      var self = this;
      self.error = null;
      if (!price || (price && !price.qty && !price.fiat)) {
        self.sellPrice = null;
        return;
      }
      self.gettingSellPrice = true;
      glideraService.sellPrice(token, price, function(err, sellPrice) {
        self.gettingSellPrice = false;
        if (err) {
          self.error = 'Could not get exchange information. Please, try again.';
          return;
        }
        self.sellPrice = sellPrice;
      });
    };

    this.get2faCode = function(token) {
      var self = this;
      ongoingProcess.set('Sending 2FA code...', true);
      $timeout(function() {
        glideraService.get2faCode(token, function(err, sent) {
          ongoingProcess.set('Sending 2FA code...', false);
          if (err) {
            self.error = 'Could not send confirmation code to your phone';
          } else {
            self.show2faCodeInput = sent;
          }
        });
      }, 100);
    };

    this.createTx = function(token, permissions, twoFaCode) {
      var self = this;
      self.error = null;
      var outputs = [];
      var configWallet = config.wallet;
      var walletSettings = configWallet.settings;

      if (!client) {
        self.error = 'No wallet selected';
        return;
      }

      ongoingProcess.set('creatingTx', true);
      addressService.getAddress(client.credentials.walletId, null, function(err, refundAddress) {
        if (!refundAddress) {

          ongoingProcess.clear();
          self.error = bwcError.msg(err, 'Could not create address');
          return;
        }
        glideraService.getSellAddress(token, function(error, sellAddress) {
          if (!sellAddress) {
            ongoingProcess.clear();
            self.error = 'Could not get the destination bitcoin address';
            return;
          }
          var amount = parseInt((self.sellPrice.qty * 100000000).toFixed(0));
          var comment = 'Glidera transaction';

          outputs.push({
            'toAddress': sellAddress,
            'amount': amount,
            'message': comment
          });

          var txp = {
            toAddress: sellAddress,
            amount: amount,
            outputs: outputs,
            message: comment,
            payProUrl: null,
            excludeUnconfirmedUtxos: configWallet.spendUnconfirmed ? false : true,
            feeLevel: walletSettings.feeLevel || 'normal',
            customData: {
              'glideraToken': token
            }
          };

          walletService.createTx(client, txp, function(err, createdTxp) {
            ongoingProcess.clear();
            if (err) {
              self.error = err.message ||  bwcError.msg(err);
              return;
            }
            $scope.$emit('Local/NeedsConfirmation', createdTxp, function(accept) {
              if (accept) {
                fingerprintService.check(client, function(err) {
                  if (err) {
                    self.error = err.message ||  bwcError.msg(err);
                    return;
                  }

                  handleEncryptedWallet(client, function(err) {
                    if (err) {
                      self.error = err.message ||  bwcError.msg(err);
                      return;
                    }

                    ongoingProcess.set('signingTx', true);
                    walletService.publishTx(client, createdTxp, function(err, publishedTxp) {
                      if (err) {
                        ongoingProcess.clear();
                        self.error = err.message ||  bwcError.msg(err);
                      }

                      walletService.signTx(client, publishedTxp, function(err, signedTxp) {
                        walletService.lock(client);
                        walletService.removeTx(client, signedTxp, function(err) {
                          if (err) $log.debug(err);
                        });
                        ongoingProcess.clear();
                        if (err) {
                          self.error = err.message ||  bwcError.msg(err);
                          return;
                        }
                        var rawTx = signedTxp.raw;
                        var data = {
                          refundAddress: refundAddress,
                          signedTransaction: rawTx,
                          priceUuid: self.sellPrice.priceUuid,
                          useCurrentPrice: self.sellPrice.priceUuid ? false : true,
                          ip: null
                        };
                        ongoingProcess.set('Seling Bitcoin', true);
                        glideraService.sell(token, twoFaCode, data, function(err, data) {
                          ongoingProcess.clear();
                          if (err) {
                            self.error = err.message ||  bwcError.msg(err);
                            $timeout(function() {
                              $scope.$emit('Local/GlideraError');
                            }, 100);
                            return;
                          }
                          self.success = data;
                          $scope.$emit('Local/GlideraTx');
                        });
                      });
                    });
                  });
                });
              } else {
                go.path('glidera');
              }
            });
          });
        });
      });
    };
  });

'use strict';

angular.module('copayApp.controllers').controller('sidebarController',
  function($rootScope, $timeout, $ionicScrollDelegate, lodash, profileService, configService, go, platformInfo) {
    var self = this;
    self.isWindowsPhoneApp = platformInfo.isWP && platformInfo.isCordova;
    self.walletSelection = false;

    // wallet list change
    $rootScope.$on('Local/WalletListUpdated', function(event) {
      self.walletSelection = false;
      self.setWallets();
    });

    $rootScope.$on('Local/ColorUpdated', function(event) {
      self.setWallets();
    });

    $rootScope.$on('Local/AliasUpdated', function(event) {
      self.setWallets();
    });

    self.signout = function() {
      profileService.signout();
    };

    self.switchWallet = function(selectedWalletId, currentWalletId) {
      var client = profileService.focusedClient;
      if (selectedWalletId == currentWalletId && client.isComplete()) return;
      self.walletSelection = false;
      profileService.setAndStoreFocus(selectedWalletId, function() {});
      $ionicScrollDelegate.scrollTop();
    };

    self.toggleWalletSelection = function() {
      self.walletSelection = !self.walletSelection;
      if (!self.walletSelection) return;
      self.setWallets();
    };

    self.setWallets = function() {
      if (!profileService.profile) return;

      var config = configService.getSync();
      config.colorFor = config.colorFor || {};
      config.aliasFor = config.aliasFor || {};

      // Sanitize empty wallets (fixed in BWC 1.8.1, and auto fixed when wallets completes)
      var credentials = lodash.filter(profileService.profile.credentials, 'walletName');
      var ret = lodash.map(credentials, function(c) {
        return {
          m: c.m,
          n: c.n,
          name: config.aliasFor[c.walletId] || c.walletName,
          id: c.walletId,
          color: config.colorFor[c.walletId] || '#4A90E2',
        };
      });

      self.wallets = lodash.sortBy(ret, 'name');
    };

    self.setWallets();
  });

'use strict';

angular.module('copayApp.controllers').controller('termOfUseController',
  function($scope, uxLanguage) {

    $scope.lang = uxLanguage.currentLanguage;

  });

'use strict';

angular.module('copayApp.controllers').controller('topbarController', function(go) { 

  this.goHome = function() {
    go.walletHome();
  };

  this.goPreferences = function() {
    go.preferences();
  };

});

'use strict';
angular.module('copayApp.controllers').controller('uriController',
  function($stateParams, $log, openURLService) {


    /* This is only for BROWSER links, it is not excecuted on mobile devices */

    $log.info('DEEP LINK from Browser:' + $stateParams.url);
    openURLService.handleURL({
      url: $stateParams.url
    });
  });

'use strict';

angular.module('copayApp.controllers').controller('versionController', function() {
  this.version = window.version;
  this.commitHash = window.commitHash;
});

'use strict';

angular.module('copayApp.controllers').controller('walletHomeController', function($scope, $rootScope, $interval, $timeout, $filter, $log, $ionicModal, $ionicPopover, notification, txStatus, profileService, lodash, configService, rateService, storageService, bitcore, gettext, gettextCatalog, platformInfo, addressService, ledger, bwcError, confirmDialog, txFormatService, addressbookService, go, feeService, walletService, fingerprintService, nodeWebkit, ongoingProcess, assetService) {

  var isCordova = platformInfo.isCordova;
  var isWP = platformInfo.isWP;
  var isAndroid = platformInfo.isAndroid;
  var isChromeApp = platformInfo.isChromeApp;

  var self = this;
  $rootScope.shouldHideMenuBar = false;
  $rootScope.wpInputFocused = false;
  var config = configService.getSync();
  var configWallet = config.wallet;
  var walletSettings = configWallet.settings;
  var ret = {};

  // INIT. Global value
  ret.unitToSatoshi = walletSettings.unitToSatoshi;
  ret.satToUnit = 1 / ret.unitToSatoshi;
  ret.unitName = walletSettings.unitName;
  ret.alternativeIsoCode = walletSettings.alternativeIsoCode;
  ret.alternativeName = walletSettings.alternativeName;
  ret.alternativeAmount = 0;
  ret.unitDecimals = walletSettings.unitDecimals;
  ret.isCordova = isCordova;
  ret.addresses = [];
  ret.isMobile = platformInfo.isMobile;
  ret.isWindowsPhoneApp = platformInfo.isWP;
  ret.countDown = null;
  ret.sendMaxInfo = {};
  ret.showAlternative = false;
  ret.fromInputAmount = null;
  var vanillaScope = ret;

  var disableScannerListener = $rootScope.$on('dataScanned', function(event, data) {
    if (!data) return;

    self.setForm(data);
    $rootScope.$emit('Local/SetTab', 'send');
    var form = $scope.sendForm;
    if (form.address.$invalid && !ongoingProcess.get('fetchingPayPro')) {
      self.resetForm();
      self.error = gettext('Could not recognize a valid Bitcoin QR Code');
    }
  });

  var disablePaymentUriListener = $rootScope.$on('paymentUri', function(event, uri) {
    $rootScope.$emit('Local/SetTab', 'send');
    $timeout(function() {
      self.setForm(uri);
    }, 100);
  });

  var disableAddrListener = $rootScope.$on('Local/AddressIsUsed', function() {
    self.setAddress(true);
  });

  var disableFocusListener = $rootScope.$on('Local/NewFocusedWalletReady', function() {
    self.addr = null;
    self.resetForm();
    $scope.search = '';

    if (profileService.focusedClient && profileService.focusedClient.isComplete()) {
      self.setAddress();
      self.setSendFormInputs();
    }

    $log.debug('Cleaning WalletHome Instance');
    lodash.each(self, function(v, k) {
      if (lodash.isFunction(v)) return;
      if (!lodash.isUndefined(vanillaScope[k])) {
        self[k] = vanillaScope[k];
        return;
      }
      if (k == 'isRateAvailable') return;

      delete self[k];
    });
  });

  var disableResumeListener = $rootScope.$on('Local/Resume', function() {
    // This is needed then the apps go to sleep
    self.bindTouchDown();
  });

  var disableTabListener = $rootScope.$on('Local/TabChanged', function(e, tab) {
    // This will slow down switch, do not add things here!
    switch (tab) {
      case 'receive':
        // just to be sure we have an address
        self.setAddress();
        break;
      case 'send':
        self.resetError();
    };
  });

  $scope.$on('$destroy', function() {
    disableAddrListener();
    disableScannerListener();
    disablePaymentUriListener();
    disableTabListener();
    disableFocusListener();
    disableResumeListener();
    $rootScope.shouldHideMenuBar = false;
  });

  if (isCordova && StatusBar.isVisible) {
    var backgroundColor = profileService.focusedClient && profileService.focusedClient.backgroundColor  ? profileService.focusedClient.backgroundColor : "#4B6178";
    StatusBar.backgroundColorByHexString(backgroundColor);
  }

  this.onQrCodeScanned = function(data) {
    if (data) go.send();
    $rootScope.$emit('dataScanned', data);
  };

  rateService.whenAvailable(function() {
    self.isRateAvailable = true;
    $rootScope.$digest();
  });

  var getClipboard = function(cb) {
    if (!isCordova || platformInfo.isWP) return cb();

    window.cordova.plugins.clipboard.paste(function(value) {
      var fc = profileService.focusedClient;
      var Address = bitcore.Address;
      var networkName = fc.credentials.network;
      if (Address.isValid(value, networkName) && !$scope.newAddress) {
        return cb(value);
      }
    });
  };

  var handleEncryptedWallet = function(client, cb) {
    if (!walletService.isEncrypted(client)) return cb();
    $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
      if (err) return cb(err);
      return cb(walletService.unlock(client, password));
    });
  };

  var accept_msg = gettextCatalog.getString('Accept');
  var cancel_msg = gettextCatalog.getString('Cancel');
  var confirm_msg = gettextCatalog.getString('Confirm');

  this.openAddressbookModal = function(wallets, address) {
    $scope.wallets = wallets;
    $scope.address = address;
    $scope.self = self;

    $ionicModal.fromTemplateUrl('views/modals/addressbook.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.addressbookModal = modal;
      $scope.addressbookModal.show();
    });
  };

  var GLIDERA_LOCK_TIME = 6 * 60 * 60;
  // isGlidera flag is a security measure so glidera status is not
  // only determined by the tx.message
  this.openTxpModal = function(tx, copayers, isGlidera) {
    $scope.self = self;
    $scope.tx = tx;
    $scope.copayers = copayers;
    $scope.isGlidera = isGlidera;
    $scope.error = null;
    $scope.loading = null;
    $scope.paymentExpired = null;
    $scope.currentSpendUnconfirmed = configWallet.spendUnconfirmed;

    $ionicModal.fromTemplateUrl('views/modals/txp-details.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.txpDetailsModal = modal;
      $scope.txpDetailsModal.show();
    });
  };

  this.setAddress = function(forceNew) {
    self.addrError = null;
    var client = profileService.focusedClient;
    if (!client || !client.isComplete()) return;

    // Address already set?
    if (!forceNew && self.addr) {
      return;
    }

    self.generatingAddress = true;
    $timeout(function() {
      addressService.getAddress(client.credentials.walletId, forceNew, function(err, addr) {
        self.generatingAddress = false;

        if (err) {
          self.addrError = err;
        } else {
          if (addr)
            self.addr = addr;
        }

        $scope.$digest();
      });
    });
  };

  this.copyToClipboard = function(addr, $event) {

    var showPopover = function() {

      $ionicPopover.fromTemplateUrl('views/includes/copyToClipboard.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.popover = popover;
        $scope.popover.show($event);
      });

      $scope.close = function() {
        $scope.popover.hide();
      }

      $timeout(function() {
        $scope.popover.hide(); //close the popover after 0.7 seconds
      }, 700);

      $scope.$on('$destroy', function() {
        $scope.popover.remove();
      });
    };

    if (isCordova) {
      window.cordova.plugins.clipboard.copy(addr);
      window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
    } else if (platformInfo.isNW) {
      nodeWebkit.writeToClipboard(addr);
      showPopover($event);
    }
  };

  this.shareAddress = function(addr) {
    if (isCordova) {
      window.plugins.socialsharing.share('bitcoin:' + addr, null, null, null);
    }
  };

  // Send

  this.resetError = function() {
    this.error = this.success = null;
  };

  this.bindTouchDown = function(tries) {
    var self = this;
    tries = tries || 0;
    if (tries > 5) return;
    var e = document.getElementById('menu-walletHome');
    if (!e) return $timeout(function() {
      self.bindTouchDown(++tries);
    }, 500);

    // on touchdown elements
    $log.debug('Binding touchstart elements...');
    ['hamburger', 'menu-walletHome', 'menu-send', 'menu-receive'].forEach(function(id) {
      var e = document.getElementById(id);
      if (e) e.addEventListener('touchstart', function() {
        try {
          event.preventDefault();
        } catch (e) {};
        angular.element(e).triggerHandler('click');
      }, true);
    });
  }

  this.hideMenuBar = lodash.debounce(function(hide) {
    if (hide) {
      $rootScope.shouldHideMenuBar = true;
    } else {
      $rootScope.shouldHideMenuBar = false;
    }
    $rootScope.$digest();
  }, 100);

  this.formFocus = function(what) {
    if (isCordova && this.isWindowsPhoneApp) {
      this.hideMenuBar(what);
    }
    var self = this;
    if (isCordova && !this.isWindowsPhoneApp && what == 'address') {
      getClipboard(function(value) {
        if (value) {
          document.getElementById("amount").focus();
          $timeout(function() {
            window.plugins.toast.showShortCenter(gettextCatalog.getString('Pasted from clipboard'));
            self.setForm(value);
          }, 100);
        }
      });
    }
  };

  this.setSendFormInputs = function() {
    var unitToSat = this.unitToSatoshi;
    var satToUnit = 1 / unitToSat;
    /**
     * Setting the two related amounts as properties prevents an infinite
     * recursion for watches while preserving the original angular updates
     *
     */
    Object.defineProperty($scope,
      "_alternative", {
        get: function() {
          return $scope.__alternative;
        },
        set: function(newValue) {
          $scope.__alternative = newValue;
          if (self.isRateAvailable) {
            $scope._amount = parseFloat((rateService.fromFiat(newValue, self.alternativeIsoCode) * satToUnit).toFixed(self.unitDecimals), 10);
          } else {
            $scope.__amount = null;
          }
        },
        enumerable: true,
        configurable: true
      });
    Object.defineProperty($scope,
      "_amount", {
        get: function() {
          return $scope.__amount;
        },
        set: function(newValue) {
          $scope.__amount = newValue;
          if (self.isRateAvailable) {
            $scope.__alternative = parseFloat((rateService.toFiat(newValue * self.unitToSatoshi, self.alternativeIsoCode)).toFixed(2), 10);
          } else {
            $scope.__alternative = null;
          }
          self.alternativeAmount = $scope.__alternative;
          self.resetError();
        },
        enumerable: true,
        configurable: true
      });

    Object.defineProperty($scope,
      "_address", {
        get: function() {
          return $scope.__address;
        },
        set: function(newValue) {
          $scope.__address = self.onAddressChange(newValue);
          if ($scope.sendForm && $scope.sendForm.address.$valid) {
            self.lockAddress = true;
          }
        },
        enumerable: true,
        configurable: true
      });

    var fc = profileService.focusedClient;
    // ToDo: use a credential's (or fc's) function for this
    this.hideNote = !fc.credentials.sharedEncryptingKey;
  };

  this.setSendError = function(err) {
    var fc = profileService.focusedClient;
    var prefix =
      fc.credentials.m > 1 ? gettextCatalog.getString('Could not create payment proposal') : gettextCatalog.getString('Could not send payment');

    this.error = bwcError.msg(err, prefix);

    $timeout(function() {
      $scope.$digest();
    }, 1);
  };

  this.setAmount = function(amount, useAlternativeAmount) {
    $scope.showAlternative = useAlternativeAmount;

    self.fromInputAmount = true;
    self.setForm(null, amount, null);
  };

  this.submitForm = function() {
    if (!$scope._amount || !$scope._address) return;
    var client = profileService.focusedClient;
    var unitToSat = this.unitToSatoshi;
    var currentSpendUnconfirmed = configWallet.spendUnconfirmed;

    var outputs = [];

    this.resetError();

    if (isCordova && this.isWindowsPhoneApp)
      $rootScope.shouldHideMenuBar = true;

    var form = $scope.sendForm;
    var comment = form.comment.$modelValue;

    // ToDo: use a credential's (or fc's) function for this
    if (comment && !client.credentials.sharedEncryptingKey) {
      var msg = 'Could not add message to imported wallet without shared encrypting key';
      $log.warn(msg);
      return self.setSendError(gettext(msg));
    }

    if (form.amount.$modelValue * unitToSat > Number.MAX_SAFE_INTEGER) {
      var msg = 'Amount too big';
      $log.warn(msg);
      return self.setSendError(gettext(msg));
    };

    $timeout(function() {
      var paypro = self._paypro;
      var address, amount;

      address = form.address.$modelValue;
      amount = assetService.getNormalizedAmount(form.amount.$modelValue);

      outputs.push({
        'toAddress': address,
        'amount': amount,
        'message': comment
      });

      var txp = {};

      if (!lodash.isEmpty(self.sendMaxInfo)) {
        txp.sendMax = true;
        txp.inputs = self.sendMaxInfo.inputs;
        txp.fee = self.sendMaxInfo.fee;
      } else {
        txp.amount = amount;
      }

      txp.toAddress = address;
      txp.outputs = outputs;
      txp.message = comment;
      txp.payProUrl = paypro ? paypro.url : null;
      txp.excludeUnconfirmedUtxos = configWallet.spendUnconfirmed ? false : true;
      txp.feeLevel = walletSettings.feeLevel || 'normal';

      ongoingProcess.set('creatingTx', true);
      assetService.createTransferTx(client, txp, function(err, createdTxp) {
        ongoingProcess.set('creatingTx', false);
        if (err) {
          return self.setSendError(err);
        }

        if (!client.canSign() && !client.isPrivKeyExternal()) {
          $log.info('No signing proposal: No private key');
          ongoingProcess.set('sendingTx', true);
          walletService.publishTx(client, createdTxp, function(err, publishedTxp) {
            ongoingProcess.set('sendingTx', false);
            if (err) {
              return self.setSendError(err);
            }
            self.resetForm();
            go.walletHome();
            var type = txStatus.notify(createdTxp);
            $scope.openStatusModal(type, createdTxp, function() {
              return $scope.$emit('Local/TxProposalAction');
            });
          });
        } else {
          $rootScope.$emit('Local/NeedsConfirmation', createdTxp, function(accept) {
            if (accept) self.confirmTx(createdTxp);
            else self.resetForm();
          });
        }
      });

    }, 100);
  };

  this.confirmTx = function(txp) {
    var client = profileService.focusedClient;
    var self = this;

    fingerprintService.check(client, function(err) {
      if (err) {
        return self.setSendError(err);
      }

      handleEncryptedWallet(client, function(err) {
        if (err) {
          return self.setSendError(err);
        }

        ongoingProcess.set('sendingTx', true);
        walletService.publishTx(client, txp, function(err, publishedTxp) {
          ongoingProcess.set('sendingTx', false);
          if (err) {
            return self.setSendError(err);
          }

          ongoingProcess.set('signingTx', true);
          walletService.signTx(client, publishedTxp, function(err, signedTxp) {
            ongoingProcess.set('signingTx', false);
            walletService.lock(client);
            if (err) {
              $scope.$emit('Local/TxProposalAction');
              return self.setSendError(
                err.message ?
                err.message :
                gettext('The payment was created but could not be completed. Please try again from home screen'));
            }

            if (signedTxp.status == 'accepted') {
              ongoingProcess.set('broadcastingTx', true);
              assetService.broadcastTx(client, signedTxp, function(err, broadcastedTxp) {
                ongoingProcess.set('broadcastingTx', false);
                if (err) {
                  return self.setSendError(err);
                }
                self.resetForm();
                go.walletHome();
                var type = txStatus.notify(broadcastedTxp);
                $scope.openStatusModal(type, broadcastedTxp, function() {
                  $scope.$emit('Local/TxProposalAction', broadcastedTxp.status == 'broadcasted');
                });
              });
            } else {
              self.resetForm();
              go.walletHome();
              var type = txStatus.notify(signedTxp);
              $scope.openStatusModal(type, signedTxp, function() {
                $scope.$emit('Local/TxProposalAction');
              });
            }
          });
        });
      });
    });
  };

  $scope.openStatusModal = function(type, txp, cb) {
    var fc = profileService.focusedClient;
    $scope.type = type;
    $scope.tx = txFormatService.processTx(txp);
    $scope.color = fc.backgroundColor;
    $scope.cb = cb;

    var txStatusUrl = 'views/modals/tx-status.html';
    if (txp.customData && txp.customData.asset) {
      if (txp.customData.asset.action == 'transfer') {
        txStatusUrl = 'views/coloredcoins/modals/transfer-status.html';
      } else {
        txStatusUrl = 'views/coloredcoins/modals/issue-status.html';
      }
    }

    $ionicModal.fromTemplateUrl(txStatusUrl, {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.txStatusModal = modal;
      $scope.txStatusModal.show();
    });
  };

  $scope.openSearchModal = function() {
    var fc = profileService.focusedClient;
    $scope.color = fc.backgroundColor;
    $scope.self = self;

    $ionicModal.fromTemplateUrl('views/modals/search.html', {
      scope: $scope,
      focusFirstInput: true
    }).then(function(modal) {
      $scope.searchModal = modal;
      $scope.searchModal.show();
    });
  };

  $scope.openCustomInputAmountModal = function(addr) {
    var fc = profileService.focusedClient;
    $scope.color = fc.backgroundColor;
    $scope.self = self;
    $scope.addr = addr;

    $ionicModal.fromTemplateUrl('views/modals/customAmount.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.customAmountModal = modal;
      $scope.customAmountModal.show();
    });
  };

  $scope.openAmountModal = function(addr) {
    if (isCordova)
      $scope.openInputAmountModal(addr);
    else
      $scope.openCustomInputAmountModal(addr);
  };

  $scope.openInputAmountModal = function(addr) {
    var fc = profileService.focusedClient;
    $scope.color = fc.backgroundColor;
    $scope.showAlternativeAmount = $scope.showAlternative || null;
    if ($scope.showAlternativeAmount) {
      $scope.amount = $scope.sendForm.alternative.$viewValue || null;
    } else {
      $scope.amount = $scope.sendForm.amount.$viewValue || null;
    }
    $scope.self = self;
    $scope.addr = addr;

    $ionicModal.fromTemplateUrl('views/modals/inputAmount.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.inputAmountModal = modal;
      $scope.inputAmountModal.show();
    });
  };

  this.setForm = function(to, amount, comment) {
    var form = $scope.sendForm;
    if (to) {
      form.address.$setViewValue(to);
      form.address.$isValid = true;
      form.address.$render();
      this.lockAddress = true;
    }

    if (amount) {
      form.amount.$setViewValue("" + amount);
      form.amount.$isValid = true;
      form.amount.$render();
      if (!this.fromInputAmount)
        this.lockAmount = true;
      this.fromInputAmount = false;
    }

    if (comment) {
      form.comment.$setViewValue(comment);
      form.comment.$isValid = true;
      form.comment.$render();
    }
  };

  this.resetForm = function() {
    this.resetError();
    this.sendMaxInfo = {};
    if (this.countDown) $interval.cancel(this.countDown);
    this._paypro = null;

    this.lockAddress = false;
    this.lockAmount = false;

    this._amount = this._address = null;

    var form = $scope.sendForm;

    if (form && form.amount) {
      form.amount.$pristine = true;
      form.amount.$setViewValue('');
      form.amount.$render();

      form.comment.$setViewValue('');
      form.comment.$render();
      form.$setPristine();

      if (form.address) {
        form.address.$pristine = true;
        form.address.$setViewValue('');
        form.address.$render();
      }
    }
    $timeout(function() {
      $rootScope.$digest();
    }, 1);
  };

  this.openPPModal = function(paypro) {
    var fc = profileService.focusedClient;
    $scope.color = fc.backgroundColor;
    $scope.self = self;
    $scope.paypro = paypro;

    $ionicModal.fromTemplateUrl('views/modals/paypro.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.payproModal = modal;
      $scope.payproModal.show();
    });
  };

  this.setFromPayPro = function(uri, cb) {
    if (!cb) cb = function() {};

    var fc = profileService.focusedClient;
    if (isChromeApp) {
      this.error = gettext('Payment Protocol not supported on Chrome App');
      return cb(true);
    }

    var satToUnit = 1 / this.unitToSatoshi;
    var self = this;
    /// Get information of payment if using Payment Protocol
    ongoingProcess.set('fetchingPayPro', true);

    $log.debug('Fetch PayPro Request...', uri);
    $timeout(function() {
      fc.fetchPayPro({
        payProUrl: uri,
      }, function(err, paypro) {
        ongoingProcess.set('fetchingPayPro', false);

        if (err) {
          $log.warn('Could not fetch payment request:', err);
          self.resetForm();
          var msg = err.toString();
          if (msg.match('HTTP')) {
            msg = gettext('Could not fetch payment information');
          }
          self.error = msg;
          $timeout(function() {
            $rootScope.$digest();
          }, 1);
          return cb(true);
        }

        if (!paypro.verified) {
          self.resetForm();
          $log.warn('Failed to verify payment protocol signatures');
          self.error = gettext('Payment Protocol Invalid');
          $timeout(function() {
            $rootScope.$digest();
          }, 1);
          return cb(true);
        }

        self._paypro = paypro;
        self.setForm(paypro.toAddress, (paypro.amount * satToUnit).toFixed(self.unitDecimals), paypro.memo);
        _paymentTimeControl(paypro.expires);
        return cb();
      });
    }, 1);
  };

  function _paymentTimeControl(expirationTime) {
    self.paymentExpired = false;
    setExpirationTime();

    self.countDown = $interval(function() {
      setExpirationTime();
    }, 1000);

    function setExpirationTime() {
      var now = Math.floor(Date.now() / 1000);
      if (now > expirationTime) {
        setExpiredValues();
        return;
      }

      var totalSecs = expirationTime - now;
      var m = Math.floor(totalSecs / 60);
      var s = totalSecs % 60;
      self.remainingTimeStr = ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
    };

    function setExpiredValues() {
      self.paymentExpired = true;
      self.remainingTimeStr = null;
      self._paypro = null;
      self.error = gettext('Cannot sign: The payment request has expired');
      if (self.countDown) $interval.cancel(self.countDown);
    };
  };

  this.setFromUri = function(uri) {
    var self = this;

    function sanitizeUri(uri) {
      // Fixes when a region uses comma to separate decimals
      var regex = /[\?\&]amount=(\d+([\,\.]\d+)?)/i;
      var match = regex.exec(uri);
      if (!match || match.length === 0) {
        return uri;
      }
      var value = match[0].replace(',', '.');
      var newUri = uri.replace(regex, value);
      return newUri;
    };

    var satToUnit = 1 / this.unitToSatoshi;

    // URI extensions for Payment Protocol with non-backwards-compatible request
    if ((/^bitcoin:\?r=[\w+]/).exec(uri)) {
      uri = decodeURIComponent(uri.replace('bitcoin:?r=', ''));
      this.setFromPayPro(uri, function(err) {
        if (err) {
          return err;
        }
      });
    } else {
      uri = sanitizeUri(uri);

      if (!bitcore.URI.isValid(uri)) {
        return uri;
      }
      var parsed = new bitcore.URI(uri);

      var addr = parsed.address ? parsed.address.toString() : '';
      var message = parsed.message;

      var amount = parsed.amount ?
        (parsed.amount.toFixed(0) * satToUnit).toFixed(this.unitDecimals) : 0;


      if (parsed.r) {
        this.setFromPayPro(parsed.r, function(err) {
          if (err && addr && amount) {
            self.setForm(addr, amount, message);
            return addr;
          }
        });
      } else {
        this.setForm(addr, amount, message);
        return addr;
      }
    }

  };

  this.onAddressChange = function(value) {
    this.resetError();
    if (!value) return '';

    if (this._paypro)
      return value;

    if (value.indexOf('bitcoin:') === 0) {
      return this.setFromUri(value);
    } else if (/^https?:\/\//.test(value)) {
      return this.setFromPayPro(value);
    } else {
      return value;
    }
  };

  // History

  function strip(number) {
    return (parseFloat(number.toPrecision(12)));
  }

  this.getUnitName = function() {
    return this.unitName;
  };

  this.getAlternativeIsoCode = function() {
    return this.alternativeIsoCode;
  };

  this.openTxModal = function(btx) {
    var self = this;

    $scope.btx = lodash.cloneDeep(btx);
    $scope.self = self;

    $ionicModal.fromTemplateUrl('views/modals/tx-details.html', {
      scope: $scope,
      hideDelay: 500
    }).then(function(modal) {
      $scope.txDetailsModal = modal;
      $scope.txDetailsModal.show();
    });
  };

  this.hasAction = function(actions, action) {
    return actions.hasOwnProperty('create');
  };

  this.sendMax = function(availableBalanceSat) {
    if (availableBalanceSat == 0) {
      this.error = gettext("Cannot create transaction. Insufficient funds");
      return;
    }

    var self = this;
    var fc = profileService.focusedClient;
    this.error = null;
    ongoingProcess.set('calculatingFee', true);

    $timeout(function() {

      feeService.getCurrentFeeValue(function(err, feePerKb) {
        ongoingProcess.set('calculatingFee', false);
        if (err || !lodash.isNumber(feePerKb)) {
          self.error = gettext('Could not get fee value');
          return;
        }

        var opts = {};
        opts.feePerKb = feePerKb;
        opts.returnInputs = true;
        var config = configService.getSync();
        opts.excludeUnconfirmedUtxos = !config.wallet.spendUnconfirmed;
        ongoingProcess.set('retrivingInputs', true);

        fc.getSendMaxInfo(opts, function(err, resp) {
          ongoingProcess.set('retrivingInputs', false);

          if (err) {
            self.error = err;
            $scope.$apply();
            return;
          }

          if (resp.amount == 0) {
            self.error = gettext("Not enough funds for fee");
            $scope.$apply();
            return;
          }

          var msg = gettextCatalog.getString("{{fee}} will be deducted for bitcoin networking fees", {
            fee: profileService.formatAmount(resp.fee) + ' ' + self.unitName
          });

          var warningMsg = verifyExcludedUtxos();

          if (!lodash.isEmpty(warningMsg))
            msg += '. \n' + warningMsg;

          confirmDialog.show(msg, function(confirmed) {
            if (confirmed) {
              self.sendMaxInfo = resp;
              var amount = parseFloat((resp.amount * self.satToUnit).toFixed(self.unitDecimals));
              self.setForm(null, amount, null);
            } else {
              self.resetForm();
            }
          });

          function verifyExcludedUtxos() {
            var warningMsg = [];
            if (resp.utxosBelowFee > 0) {
              warningMsg.push(gettextCatalog.getString("Note: a total of {{amountBelowFeeStr}} were excluded. These funds come from UTXOs smaller than the network fee provided.", {
                amountBelowFeeStr: profileService.formatAmount(resp.amountBelowFee) + ' ' + self.unitName
              }));
            }
            if (resp.utxosAboveMaxSize > 0) {
              warningMsg.push(gettextCatalog.getString("Note: a total of {{amountAboveMaxSizeStr}} were excluded. The maximum size allowed for a transaction was exceeded", {
                amountAboveMaxSizeStr: profileService.formatAmount(resp.amountAboveMaxSize) + ' ' + self.unitName
              }));
            }
            return warningMsg.join('\n');
          }
        });
      });
    }, 10);
  };

  /* Start setup */
  lodash.assign(self, vanillaScope);

  this.bindTouchDown();
  if (profileService.focusedClient) {
    this.setAddress();
    this.setSendFormInputs();
  }

});

'use strict';

angular.module('copayApp.controllers').controller('walletInfoController',
    function ($scope, $rootScope, $timeout, profileService, configService,
              lodash, coloredCoins, assetService, instanceConfig, $ionicModal) {

  var self = this;

  function initAssets() {

    var assetsMap = coloredCoins.assetsMap || {},
        name, balanceStr;

    assetService.getSupportedAssets(function(assets) {
      self.assets = assets.map(function(asset) {
        var existingAsset = assetsMap[asset.assetId];
        name = asset.name || asset.symbol || asset.assetId;

        if (existingAsset) {
          balanceStr = existingAsset.balanceStr;
        } else {
          var unit = coloredCoins.getAssetSymbol(asset.assetId, null);
          balanceStr = coloredCoins.formatAssetAmount(0, null, unit);
        }
        return {
          assetName: name,
          assetId: asset.assetId,
          balanceStr: balanceStr,
          custom: asset.custom
        };
      })
      .concat([{
        assetName: 'Bitcoin',
        assetId: 'bitcoin',
        balanceStr: assetService.btcBalance
      }])
      .sort(function(a1, a2) {
        return a1.assetName > a2.assetName;
      });
    });
  }

  var setAssets = initAssets.bind(this);

  coloredCoins.getAssets().then(function(assets) {
    self.assetId = assetService.walletAsset.assetId;
    setAssets();
  });

  var disableAssetListener = $rootScope.$on('Local/WalletAssetUpdated', function (event, walletAsset) {
    setAssets();
    self.assetId = assetService.walletAsset.assetId;
    $timeout(function() {
      $rootScope.$digest();
    });
  });

  var disableSupportedAssetsChangeListener = $rootScope.$on('Local/NewCustomAsset', function (event, walletAsset) {
    setAssets();
  });

  $scope.$on('$destroy', function () {
    disableAssetListener();
    disableSupportedAssetsChangeListener();
  });

  this.setSelectedAsset = function(assetId) {
    assetService.setSelectedAsset(assetId);
  };

  this.removeCustomAsset = function(assetId) {
    assetService.removeCustomAsset(assetId, function() {
      if (self.assetId == assetId) {
        assetService.setSelectedAsset(instanceConfig.defaultAsset);
      }
      setAssets();
    });
  };

  this.showTokenModal = function() {
    $ionicModal.fromTemplateUrl('views/modals/addToken.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.addTokenModal = modal;
      $scope.addTokenModal.show();
    });
  }
});

angular.module('copayApp').run(['gettextCatalog', function (gettextCatalog) {
/* jshint -W100 */
/* jshint +W100 */
}]);
window.version="0.0.2";
window.commitHash="4821f93";
'use strict';

angular.element(document).ready(function() {

  // Run copayApp after device is ready.
  var startAngular = function() {
    angular.bootstrap(document, ['copayApp']);
  };


  function handleOpenURL(url) {
    if ('cordova' in window) {
      console.log('DEEP LINK:' + url);
      cordova.fireDocumentEvent('handleopenurl', {
        url: url
      });
    } else {
      console.log("ERROR: Cannont handle open URL in non-cordova apps")
    }
  };

  /* Cordova specific Init */
  if ('cordova' in window) {

    window.handleOpenURL = handleOpenURL;


    document.addEventListener('deviceready', function() {

      window.open = cordova.InAppBrowser.open;

      // Create a sticky event for handling the app being opened via a custom URL
      cordova.addStickyDocumentEventHandler('handleopenurl');
      startAngular();
    }, false);

  } else {
    startAngular();
  }

});

window.TREZOR_CHROME_URL = './bower_components/trezor-connect/chrome/wrapper.html';


angular.module('copayApp').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('views/add.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Add wallet'; closeToHome = true; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "<div class=content>\n" +
    "<ul class=\"no-bullet manage size-12\">\n" +
    "	<li>\n" +
    "		<a title=\"Create new wallet\" href ui-sref=create>\n" +
    "			<i class=\"fi-plus circle plus-fixed\"></i>	\n" +
    "			<i class=\"icon-arrow-right3 size-18 right m20t\"></i>  \n" +
    "			<span translate>Create new wallet</span>\n" +
    "		</a>\n" +
    "	</li>\n" +
    "	<li>\n" +
    "		<a title=\"Join shared wallet\" href ui-sref=join>\n" +
    "			<i class=\"icon-people circle\"></i>	  \n" +
    "			<i class=\"icon-arrow-right3 size-18 right m20t\"></i>  \n" +
    "			<span translate>Join shared wallet</span>\n" +
    "		</a>\n" +
    "	</li>\n" +
    "	<li>\n" +
    "		<a title=\"Import wallet\" href ui-sref=import>\n" +
    "			<i class=\"icon-download circle\"></i>	  \n" +
    "			<i class=\"icon-arrow-right3 size-18 right m20t\"></i>  \n" +
    "			<span translate>Import wallet </span>\n" +
    "		</a>\n" +
    "	</li>\n" +
    "\n" +
    "</ul>\n" +
    "</div>\n"
  );


  $templateCache.put('views/amazon.html',
    "\n" +
    "<div class=topbar-container>\n" +
    "  <nav ng-controller=\"topbarController as topbar\" class=tab-bar>\n" +
    "    <section class=left-small>\n" +
    "      <a class=p10 ng-click=topbar.goHome()>\n" +
    "        <span class=text-close>Close</span>\n" +
    "      </a>\n" +
    "    </section>\n" +
    "\n" +
    "    <section class=\"middle tab-bar-section\">\n" +
    "      <h1 class=\"title ellipsis\">\n" +
    "        Gift cards\n" +
    "      </h1>\n" +
    "    </section>\n" +
    "  </nav>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content amazon p20b\" ng-controller=\"amazonController as amazon\">\n" +
    "\n" +
    "  <div ng-init=amazon.init()>\n" +
    "\n" +
    "    <div class=\"box-notification text-center size-12 text-warning\" ng-show=amazon.sandbox>\n" +
    "      <i class=fi-info></i>\n" +
    "      Sandbox version. Only for testing purpose\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"m20t text-center\" ng-click=amazon.updatePendingGiftCards()>\n" +
    "      <img src=img/GCs-logo-cllb.png alt=\"Amazon.com Gift Card\" width=200>\n" +
    "      <div class=\"size-10 m5t text-gray\"><b>Only</b> redeemable on www.amazon.com (USA website)</div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-if=!giftCards class=\"m20t text-center size-12\">\n" +
    "\n" +
    "      <div class=row>\n" +
    "        <div class=columns>\n" +
    "          <button class=\"m20t button black round expand\" ui-sref=buyAmazon>\n" +
    "            Buy now\n" +
    "          </button>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"text-left p10h m30v\">\n" +
    "        Amazon.com Gift Cards never expire and can be redeemed towards millions of items at\n" +
    "        <a ng-click=\"$root.openExternalLink('https://www.amazon.com')\">www.amazon.com</a>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=p20t ng-if=giftCards>\n" +
    "      <ul class=\"no-bullet m0 size-14\">\n" +
    "        <li class=\"line-b line-t p10 pointer\" href ui-sref=buyAmazon>\n" +
    "          <i class=\"fi-shopping-cart size-24 m5l vm dib\"></i>\n" +
    "          <span class=\"m10l text-normal text-bold\">Buy Gift Card</span>\n" +
    "          <span class=\"right text-gray m5t\">\n" +
    "            <i class=\"icon-arrow-right3 size-24 right\"></i>\n" +
    "          </span>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "      <h4 class=title>Your cards</h4>\n" +
    "      <div ng-repeat=\"(id, item) in giftCards | orderObjectBy:'date':true track by $index\" ng-click=amazon.openCardModal(item) class=\"row collapse last-transactions-content size-12\">\n" +
    "        <div class=\"large-2 medium-2 small-2 columns\">\n" +
    "          <img src=img/a-smile_color_btn.png alt={{id}} width=40>\n" +
    "        </div>\n" +
    "        <div class=\"large-4 medium-4 small-4 columns m5t size-18\" ng-if=item.claimCode>\n" +
    "          {{item.amount | currency : '$ ' : 2}}\n" +
    "        </div>\n" +
    "        <div class=\"large-4 medium-4 small-4 columns m5t size-18\" ng-if=!item.claimCode>\n" +
    "          -\n" +
    "        </div>\n" +
    "        <div class=\"large-5 medium-5 small-5 columns text-right m10t\">\n" +
    "          <span class=text-warning ng-if=\"item.status == 'FAILURE' || item.status == 'RESEND'\">Error</span>\n" +
    "          <span class=text-gray ng-if=\"item.status == 'PENDING'\">Pending to confirmation</span>\n" +
    "          <span class=text-gray ng-if=\"item.status == 'SUCCESS' && item.cardStatus == 'Canceled'\">Canceled</span>\n" +
    "          <span class=text-gray ng-if=\"item.status == 'SUCCESS' && item.cardStatus == 'Fulfilled'\">{{item.date | amTimeAgo}}</span>\n" +
    "        </div>\n" +
    "        <div class=\"large-1 medium-1 small-1 columns text-right m10t\">\n" +
    "          <i class=\"icon-arrow-right3 size-18\"></i>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=extra-margin-bottom></div>\n" +
    "</div>\n"
  );


  $templateCache.put('views/backup.html',
    "<div class=backup ng-controller=backupController ng-init=init(index.prevState)>\n" +
    "  <nav class=tab-bar>\n" +
    "    <section class=left-small ng-show=\"(step != 1 && step != 4)\">\n" +
    "      <a ng-click=goToStep(1);>\n" +
    "        <i class=\"icon-arrow-left3 icon-back\"></i>\n" +
    "      </a>\n" +
    "    </section>\n" +
    "\n" +
    "    <section class=\"middle tab-bar-section\" ng-style=\"{'color':index.backgroundColor}\">\n" +
    "      <span>{{walletName}}</span>\n" +
    "    </section>\n" +
    "\n" +
    "    <section class=right-small>\n" +
    "      <a class=p10 ng-click=goBack()>\n" +
    "        <span class=text-close>\n" +
    "          <i class=\"fi-x size-24\"></i>\n" +
    "        </span>\n" +
    "      </a>\n" +
    "    </section>\n" +
    "  </nav>\n" +
    "\n" +
    "  <div class=box-notification ng-show=error>\n" +
    "    <span class=text-warning>\n" +
    "      {{error|translate}}\n" +
    "    </span>\n" +
    "  </div>\n" +
    "\n" +
    "    \n" +
    "\n" +
    "  <div class=\"content preferences text-center\">\n" +
    "    <div ng-show=\"step == 1\">\n" +
    "      <div ng-show=\"mnemonicWords || (!credentialsEncrypted && !deleted)\" class=row>\n" +
    "        <h5 class=text-center translate>Write your wallet recovery phrase</h5>\n" +
    "        <div class=\"size-14 text-gray columns\" ng-show=\"(index.n>1 && index.m != index.n )\">\n" +
    "          <span translate>\n" +
    "            To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need\n" +
    "          </span>:\n" +
    "          <div class=\"m10t columns size-14 text-gray\">\n" +
    "            <span translate>Your wallet recovery phrase and access to the server that coordinated the initial wallet creation. You still need {{index.m}} keys to spend.</span>\n" +
    "            <span translate><b>OR</b> the wallet recovery phrase of <b>all</b> copayers in the wallet</span>\n" +
    "            <span translate><b>OR</b> 1 wallet export file and the remaining quorum of wallet recovery phrases (e.g. in a 3-5 wallet: 1 wallet export file + 2 wallet recovery phrases of any of the other copayers).</span>\n" +
    "          </div>\n" +
    "          \n" +
    "        </div>\n" +
    "        <div class=\"size-14 text-gray columns\" ng-show=\"(index.n>1 && index.m == index.n )\">\n" +
    "          <span translate>\n" +
    "            To restore this {{index.m}}-{{index.n}} <b>shared</b> wallet you will need\n" +
    "          </span>:\n" +
    "          <div class=\"m10t columns size-14 text-gray\">\n" +
    "            <span translate>Your wallet recovery phrase and access to the server that coordinated the initial wallet creation. You still need {{index.m}} keys to spend.</span>\n" +
    "            <span translate><b>OR</b> the wallet recovery phrases of <b>all</b> copayers in the wallet</span>\n" +
    "          </div>\n" +
    "          \n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"row m20t\" ng-show=deleted>\n" +
    "        <div class=\"columns size-14 text-gray text-center\" translate>\n" +
    "          Wallet recovery phrase not available. You can still export it from Advanced &gt; Export.\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div ng-show=\"mnemonicWords || (!credentialsEncrypted && !deleted)\">\n" +
    "        <p class=\"text-center columns text-gray\" ng-show=\"index.n==1 && step == 1\">\n" +
    "          <span translate>\n" +
    "            You need the wallet recovery phrase to restore this personal wallet. Write it down and keep them somewhere safe.\n" +
    "          </span>\n" +
    "        </p>\n" +
    "        <div class=row ng-show=!credentialsEncrypted>\n" +
    "          <div class=columns>\n" +
    "            <div class=panel ng-class=\"{'enable_text_select': index.network == 'testnet'}\">\n" +
    "              <span ng-repeat=\"word in mnemonicWords track by $index\"><span style=white-space:nowrap>{{word}}</span><span ng-show=useIdeograms>&#x3000;</span> </span>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"columns extra-padding-bottom\" ng-show=!credentialsEncrypted>\n" +
    "        <div class=\"line-t p10 size-10 text-gray text-center\" ng-show=mnemonicHasPassphrase>\n" +
    "            <i class=fi-alert></i>\n" +
    "            <span translate>\n" +
    "              This recovery phrase was created with a password. To recover this wallet both the recovery phrase and password are needed.\n" +
    "            </span>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=button-box>\n" +
    "        <button ng-show=!deleted ng-disabled=\"credentialsEncrypted || error\" class=\"round expand m0\" ng-style=\"{'background-color':index.backgroundColor}\" ng-click=goToStep(2); translate>Continue\n" +
    "        </button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    \n" +
    "\n" +
    "    <div ng-show=\"step == 2\">\n" +
    "      <ion-content class=m20b>\n" +
    "        <div class=\"columns text-center extra-padding-bottom\">\n" +
    "          <h5 translate>Confirm your wallet recovery phrase</h5>\n" +
    "          <p class=\"text-gray m0\" translate>\n" +
    "            Please tap the words in order to confirm your backup phrase is correctly written.\n" +
    "          </p>\n" +
    "          <div class=\"panel words text-left\">\n" +
    "            <span ng-repeat=\"cword in customWords track by $index\" ng-show=customWords[$index]>\n" +
    "              <button class=\"button radius tiny words\" ng-click=\"removeButton($index, cword)\">{{cword.word}}</button>\n" +
    "            </span>\n" +
    "          </div>\n" +
    "          <div class=text-left>\n" +
    "            <span ng-repeat=\"shuffledWord in shuffledMnemonicWords track by $index\">\n" +
    "              <button class=\"button radius tiny words\" ng-click=\"addButton($index, shuffledWord)\" ng-disabled=shuffledWord.selected>{{shuffledWord.word}}\n" +
    "              </button>\n" +
    "            </span>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </ion-content>\n" +
    "\n" +
    "      <div class=button-box>\n" +
    "        <button ng-disabled=!selectComplete class=\"round expand m0\" ng-style=\"{'background-color':index.backgroundColor}\" ng-click=goToStep(3); translate>Continue\n" +
    "        </button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    \n" +
    "\n" +
    "    <div ng-show=\"step == 3\">\n" +
    "      <div class=\"columns text-center\">\n" +
    "        <h5 translate>Enter your password</h5>\n" +
    "        <p class=\"text-gray m0\" translate>\n" +
    "          In order to verify your wallet backup, please type your password:\n" +
    "        </p>\n" +
    "        <div class=m20v>\n" +
    "          <input id=passphrase ng-model=passphrase autocapitalize=off spellcheck=false autofocus/>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=button-box>\n" +
    "        <button ng-disabled=!passphrase ng-style=\"{'background-color':index.backgroundColor}\" class=\"button round expand m0\" ng-click=goToStep(4); translate>Continue\n" +
    "        </button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    \n" +
    "\n" +
    "    <div ng-show=\"step == 4\">\n" +
    "      <div class=\"row m10t m10b text-center\" ng-show=!backupError>\n" +
    "        <div class=circle-icon>\n" +
    "          <i class=\"fi-like size-48\"></i>\n" +
    "        </div>\n" +
    "        <h5 translate>Congratulations!</h5>\n" +
    "        <p class=\"text-gray columns\" translate>\n" +
    "          You backed up your wallet. You can now restore this wallet at any time.\n" +
    "        </p>\n" +
    "\n" +
    "        <div class=\"columns text-center m20t\">\n" +
    "          <button ng-style=\"{'background-color':index.backgroundColor}\" class=\"button round expand\" href ui-sref=walletHome translate>Finish\n" +
    "          </button>\n" +
    "          \n" +
    "          <div class=\"row m20t\" ng-show=\"index.n==1\">\n" +
    "            <div class=\"columns size-10 text-gray\">\n" +
    "              <div class=\"p10t line-t\">\n" +
    "                <span translate>You can safely install your wallet on another device and use it from multiple devices at the same time.</span>\n" +
    "                <a href=# ng-click=\"$root.openExternalLink('https://github.com/bitpay/copay/blob/master/README.md#copay-backups-and-recovery')\" translate>\n" +
    "                  Learn more about Copay backups\n" +
    "                </a>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div class=\"row m10t m10b text-center\" ng-show=backupError>\n" +
    "        <div class=circle-icon>\n" +
    "          <i class=\"fi-dislike size-48\"></i>\n" +
    "        </div>\n" +
    "        <h5 translate>Backup failed</h5>\n" +
    "        <p class=\"text-gray columns\" translate>\n" +
    "          Failed to verify backup. Please check your information\n" +
    "        </p>\n" +
    "        <div class=\"columns size-10 text-gray extra-padding-bottom\" ng-show=\"index.n==1\">\n" +
    "          <div class=\"p10t line-t\">\n" +
    "            <span translate>You can safely install your wallet on another device and use it from multiple devices at the same time.</span>\n" +
    "            <a href=# ng-click=\"$root.openExternalLink('https://github.com/bitpay/copay/blob/master/README.md#copay-backups-and-recovery')\" translate>\n" +
    "              Learn more about Copay backups\n" +
    "            </a>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=button-box>\n" +
    "          <button ng-style=\"{'background-color':index.backgroundColor}\" class=\"button round expand m0\" ng-click=goToStep(1); translate>Try again\n" +
    "          </button>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/buyAmazon.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Buy'; goBackToState = 'amazon'; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<div class=\"content amazon\" ng-controller=\"buyAmazonController as buy\">\n" +
    "\n" +
    "  <div class=\"row m10t\" ng-show=!buy.giftCard ng-init=buy.init()>\n" +
    "    <div class=columns>\n" +
    "\n" +
    "      <div class=\"box-notification m20b\" ng-show=buy.error ng-click=\"buy.error = null\">\n" +
    "        <span class=text-warning>\n" +
    "          {{buy.error}}\n" +
    "        </span>\n" +
    "        <div class=\"m10t size-12\" ng-show=buy.errorInfo>\n" +
    "          There was an error when trying to buy gift card, but the funds were sent to BitPay Invoice. Please, contact\n" +
    "          BitPay to refund your bitcoin\n" +
    "          <div class=\"p10 m10t\">\n" +
    "            Amount: {{buy.errorInfo.amount}} {{buy.errorInfo.currency}}<br>\n" +
    "            BitPay Invoice ID: {{buy.errorInfo.invoiceId}}.\n" +
    "          </div>\n" +
    "          <div class=text-center>\n" +
    "            <a ng-click=$root.openExternalLink(buy.errorInfo.invoiceUrl)>Open invoice</a>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=text-center>\n" +
    "        <img src=img/a_generic.jpg alt=\"Amazon.com Gift Card\" width=180>\n" +
    "        <div class=\"text-left size-10 m10t\">\n" +
    "          Use your Amazon.com Gift Card* to shop from a huge selection of books, electronics, music, movies, software, apparel, toys, and more.\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <form class=m30v name=buyAmazonForm ng-submit=buy.createTx() novalidate>\n" +
    "\n" +
    "        <label>\n" +
    "          Amount\n" +
    "        </label>\n" +
    "        <div class=input>\n" +
    "          <input type=number id=fiat name=fiat ng-attr-placeholder=\"{{'Amount in USD'}}\" min=0.01 max=500 ng-model=fiat autocomplete=off required>\n" +
    "\n" +
    "          <a class=\"postfix button black\">USD</a>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=m10b>\n" +
    "          <label>Pay From Copay Wallet</label>\n" +
    "          <div class=input>\n" +
    "            <input id=address name=address ng-disabled=buy.selectedWalletId ng-attr-placeholder=\"{{'Choose your source wallet'}}\" ng-model=buy.selectedWalletName required>\n" +
    "            <a ng-click=openWalletsModal(buy.allWallets) class=\"postfix size-12 m0 text-gray\">\n" +
    "              <i class=\"icon-wallet size-18\"></i>\n" +
    "            </a>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"input m20t\">\n" +
    "          <input class=\"button black round expand\" ng-disabled=\"!buy.selectedWalletId || !fiat\" type=submit value=\"Buy now\">\n" +
    "          <div class=\"size-10 text-gray text-center\">\n" +
    "            Purchase Amount is limited to USD 500 per day\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </form>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=m10t ng-show=buy.giftCard>\n" +
    "    <div class=m10h ng-show=\"buy.giftCard.status != 'SUCCESS' && buy.giftCard.status != 'PENDING'\">\n" +
    "      <h1 class=text-center>Gift card could not be created</h1>\n" +
    "      <div class=\"box-notification m20b\">\n" +
    "        <span class=text-warning>\n" +
    "          There was an error when trying to create the Amazon.com Gift Card. Status: {{buy.giftCard.status}}\n" +
    "        </span>\n" +
    "      </div>\n" +
    "      <div class=\"text-gray size-12 m20t\">\n" +
    "        <span ng-show=\"buy.giftCard.status == 'RESEND'\">\n" +
    "          This is a temporary/recoverable system failure that can be\n" +
    "          resolved retrying the request from your list of cards\n" +
    "        </span>\n" +
    "        <span ng-show=\"buy.giftCard.status == 'FAILURE'\">\n" +
    "          This failure could not be recoverable. Request your refund from your list of cards\n" +
    "        </span>\n" +
    "        <button class=\"m20t button outline round dark-gray expand\" ng-click=\"$root.go('amazon')\">\n" +
    "          Back\n" +
    "        </button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <div ng-show=\"buy.giftCard.status == 'SUCCESS'\">\n" +
    "      <div class=\"size-12 p15h\">\n" +
    "        Thank you for participating in the BitPay offer. It is our pleasure to send\n" +
    "        you this Amazon.com Gift Card* that can be redeemed towards millions of items at\n" +
    "        <a ng-click=\"$root.openExternalLink('https://www.amazon.com')\">www.amazon.com</a>.\n" +
    "        You may want to print this screen for easy reference later you will need the gift card claim code below.\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"oh m20t p15 white size-12 text-center\">\n" +
    "        <img class=m10h src=img/a_generic.jpg alt=\"Amazon.com Gift Cards\" width=200>\n" +
    "        <div class=\"m10t size-14\">\n" +
    "          Gift Card Amount:\n" +
    "          <span class=text-bold>\n" +
    "            {{buy.giftCard.amount | currency : '$ ' : 2 }}\n" +
    "          </span>\n" +
    "        </div>\n" +
    "        <div class=size-14>\n" +
    "          Claim code: <span class=\"text-bold enable_text_select\">{{buy.giftCard.claimCode}}</span>\n" +
    "        </div>\n" +
    "        <div class=m10t>\n" +
    "          <button class=\"button black round tiny\" ng-click=\"$root.openExternalLink('https://www.amazon.com/gc/redeem?claimCode=' + buy.giftCard.claimCode, '_system')\">\n" +
    "            Redeem Now\n" +
    "          </button>\n" +
    "        </div>\n" +
    "        <div class=\"size-12 m10t text-center\">\n" +
    "          <a ng-click=$root.openExternalLink(buy.giftCard.invoiceUrl)>See invoice</a>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div class=\"oh m20t p15h size-12\">\n" +
    "        To redeem your gift card, follow these steps:\n" +
    "\n" +
    "        <ol class=\"m10t size-12\">\n" +
    "          <li>1. Visit <a ng-click=\"$root.openExternalLink('https://www.amazon.com/gc')\">www.amazon.com/gc</a>\n" +
    "          </li><li>2. Click Apply to Account and enter the Claim Code when prompted.\n" +
    "          </li><li>3. Gift card funds will be applied automatically to eligible orders during the checkout process.\n" +
    "          </li><li>4. You must pay for any remaining balance on your order with another payment method.\n" +
    "        </li></ol>\n" +
    "\n" +
    "        <p class=size-12>\n" +
    "        Your gift card claim code may also be entered when prompted during checkout. To redeem your gift card using\n" +
    "        the Amazon.com 1-Click&reg; service, first add the gift card funds to Your Account.\n" +
    "        </p>\n" +
    "\n" +
    "        <p class=size-12>\n" +
    "        If you have questions about redeeming your gift card, please visit\n" +
    "        <a ng-click=\"$root.openExternalLink('https://www.amazon.com/gc-redeem')\">www.amazon.com/gc-redeem</a>.\n" +
    "        If you have questions regarding the BitPay Introductory offer, please contact BitPay.\n" +
    "        </p>\n" +
    "\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"size-12 white p15 m20t\">\n" +
    "    * <a ng-click=\"$root.openExternalLink('http://amazon.com')\">Amazon.com</a> is not a sponsor of this promotion.\n" +
    "    Except as required by law, <a ng-click=\"$root.openExternalLink('http://amazon.com')\">Amazon.com</a>\n" +
    "    Gift Cards (\"GCs\") cannot be transferred for value or redeemed for cash. GCs may be used only for purchases of\n" +
    "    eligible goods at <a ng-click=\"$root.openExternalLink('http://amazon.com')\">Amazon.com</a> or certain of its\n" +
    "    affiliated websites. For complete terms and conditions, see\n" +
    "    <a ng-click=\"$root.openExternalLink('https://www.amazon.com/gc-legal')\">www.amazon.com/gc-legal</a>.\n" +
    "    GCs are issued by ACI Gift Cards, Inc., a Washington corporation. All Amazon &reg;, &trade; &amp; &copy; are IP\n" +
    "    of <a ng-click=\"$root.openExternalLink('http://amazon.com')\">Amazon.com</a>, Inc. or its affiliates.\n" +
    "    No expiration date or service fees.\n" +
    "  </div>\n" +
    "\n" +
    "</div>\n" +
    "<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/buyAndSell.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Buy and Sell'; closeToHome = true; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=content>\n" +
    "<ul class=\"no-bullet manage text-center\">\n" +
    "  <li class=\"white m20t\" ng-show=index.glideraEnabled>\n" +
    "		<a href ui-sref=glidera>\n" +
    "      <img src=img/glidera-logo.png width=150>\n" +
    "		</a>\n" +
    "	</li>\n" +
    "  <li class=\"white m20t\" ng-show=index.coinbaseEnabled>\n" +
    "		<a href ui-sref=coinbase>\n" +
    "      <img src=img/coinbase-logo.png width=150>\n" +
    "		</a>\n" +
    "	</li>\n" +
    "</ul>\n" +
    "</div>\n"
  );


  $templateCache.put('views/buyCoinbase.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Buy'; goBackToState = 'coinbase'; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<div class=\"content coinbase\" ng-controller=\"buyCoinbaseController as buy\">\n" +
    "\n" +
    "  <div class=\"row m20t\" ng-show=\"buy.error || index.coinbaseError\" ng-click=\"buy.error = null\">\n" +
    "    <div class=columns>\n" +
    "      <div class=box-notification>\n" +
    "        <ul class=\"no-bullet m0 size-12 text-warning\">\n" +
    "          <li ng-repeat=\"err in (buy.error.errors || index.coinbaseError.errors)\" ng-bind-html=err.message></li>\n" +
    "        </ul>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"row m20ti\" ng-show=\"index.coinbaseAccount && !buy.buyInfo && !buy.receiveInfo\">\n" +
    "    <div class=columns>\n" +
    "\n" +
    "      <form name=buyCoinbaseForm ng-submit=\"buy.buyRequest(index.coinbaseToken, index.coinbaseAccount)\" novalidate>\n" +
    "\n" +
    "        <div ng-if=index.coinbaseToken ng-init=buy.getPaymentMethods(index.coinbaseToken)>\n" +
    "          <label>Payment method</label>\n" +
    "          <select ng-model=selectedPaymentMethod.id ng-options=\"item.id as item.name for item in buy.paymentMethods\">\n" +
    "          </select>\n" +
    "        </div>\n" +
    "\n" +
    "        <label>Amount\n" +
    "          <span ng-if=index.coinbaseToken ng-init=buy.getPrice(index.coinbaseToken) ng-show=buy.buyPrice class=\"size-11 text-light right\">\n" +
    "            1 BTC <i class=icon-arrow-right></i> {{buy.buyPrice.amount}} {{buy.buyPrice.currency}}\n" +
    "          </span>\n" +
    "        </label>\n" +
    "\n" +
    "        <div class=input>\n" +
    "          <input ng-show=!showAlternative type=number id=amount ignore-mouse-wheel name=amount ng-attr-placeholder=\"{{'Amount in ' + (showAlternative ? 'USD' : 'BTC')}}\" ng-minlength=0.00000001 ng-maxlength=10000000000 ng-model=amount autocomplete=off ng-disabled=buy.loading>\n" +
    "\n" +
    "          <input ng-show=showAlternative type=number id=fiat ignore-mouse-wheel name=fiat ng-attr-placeholder=\"{{'Amount in ' + (showAlternative ? 'USD' : 'BTC')}}\" ng-model=fiat autocomplete=off ng-disabled=buy.loading>\n" +
    "\n" +
    "          <a ng-show=!showAlternative class=\"postfix button\" ng-click=\"showAlternative = true; amount = null\">BTC</a>\n" +
    "          <a ng-show=showAlternative class=\"postfix button black\" ng-click=\"showAlternative = false; fiat = null\">USD</a>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"text-center text-gray size-12 m10b\">\n" +
    "          <span ng-show=\"!(amount || fiat)\">\n" +
    "            Enter the amount to get the exchange rate\n" +
    "          </span>\n" +
    "          <span ng-show=\"!buy.buyPrice && (amount || fiat)\">\n" +
    "            Not available\n" +
    "          </span>\n" +
    "          <span ng-show=\"buy.buyPrice && amount && !fiat\">\n" +
    "            ~ {{buy.buyPrice.amount * amount | currency : 'USD ' : 2}}\n" +
    "          </span>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=text-center>\n" +
    "          <i class=\"db fi-arrow-down size-24 m10v\"></i>\n" +
    "        </div>\n" +
    "\n" +
    "        <div ng-if=index.coinbaseToken ng-init=buy.init(index.coinbaseTestnet) ng-click=openWalletsModal(buy.allWallets)>\n" +
    "          <label>Copay Wallet</label>\n" +
    "          <div class=input>\n" +
    "            <input id=address name=address ng-disabled=buy.selectedWalletId ng-attr-placeholder=\"{{'Choose a wallet to receive bitcoin'}}\" ng-model=buy.selectedWalletName required>\n" +
    "            <a class=\"postfix size-12 m0 text-gray\">\n" +
    "              <i class=\"icon-wallet size-18\"></i>\n" +
    "            </a>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"input m20t\">\n" +
    "          <input class=\"button black expand round\" ng-disabled=\"buy.loading || (!amount && !fiat) || !selectedPaymentMethod\" ng-style=\"{'background-color': '#2b71b1'}\" type=submit value=\"{{'Continue'}}\">\n" +
    "        </div>\n" +
    "      </form>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"m20ti row\" ng-show=\"buy.receiveInfo && !buy.sellInfo && !buy.success\">\n" +
    "    <div class=columns>\n" +
    "      <h1>Funds sent to Copay Wallet</h1>\n" +
    "      <p class=\"size-12 text-gray\">\n" +
    "        Buy confirmed. Funds will be send soon to your selected Copay Wallet\n" +
    "      </p>\n" +
    "      <button class=\"m20t outline black round expand\" ng-style=\"{'background-color': '#2b71b1'}\" href ui-sref=coinbase>OK</button>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div ng-show=\"buy.buyInfo && !buy.receiveInfo && !buy.success\">\n" +
    "    <h4 class=title>Confirm transaction</h4>\n" +
    "\n" +
    "    <ul class=\"no-bullet m10t size-12 white\">\n" +
    "      <li class=\"line-b line-t p15\">\n" +
    "        <span class=\"m10 text-normal text-bold\">Amount</span>\n" +
    "        <span class=\"right text-gray\">{{buy.buyInfo.amount.amount}} {{buy.buyInfo.amount.currency}}</span>\n" +
    "      </li>\n" +
    "      <li class=\"line-b oh p15\">\n" +
    "        <span class=\"m10 text-normal text-bold\">Fees</span>\n" +
    "        <span class=\"right text-gray\">\n" +
    "          <div ng-repeat=\"fee in buy.buyInfo.fees\">\n" +
    "            <b>{{fee.type}}</b> {{fee.amount.amount}} {{fee.amount.currency}}\n" +
    "          </div>\n" +
    "        </span>\n" +
    "      </li>\n" +
    "      <li class=\"line-b p15\">\n" +
    "        <span class=\"m10 text-normal text-bold\">Subtotal</span>\n" +
    "        <span class=\"right text-gray\">{{buy.buyInfo.subtotal.amount}} {{buy.buyInfo.subtotal.currency}}</span>\n" +
    "      </li>\n" +
    "      <li class=\"line-b p15\">\n" +
    "        <span class=\"m10 text-normal text-bold\">Total</span>\n" +
    "        <span class=\"right text-gray\">{{buy.buyInfo.total.amount}} {{buy.buyInfo.total.currency}}</span>\n" +
    "      </li>\n" +
    "      <li class=\"line-b p15\">\n" +
    "        <span class=\"m10 text-normal text-bold\">Payout at</span>\n" +
    "        <span class=\"right text-gray\">{{buy.buyInfo.payout_at | amCalendar}}</span>\n" +
    "      </li>\n" +
    "      <li class=\"line-b p15\">\n" +
    "        <span class=\"m10 text-normal text-bold\">Deposit into Copay Wallet</span>\n" +
    "        <span class=\"right text-gray\">{{buy.selectedWalletName}}</span>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "    <div class=row>\n" +
    "      <div class=columns>\n" +
    "        <button class=\"button black round expand\" ng-style=\"{'background-color': '#2b71b1'}\" ng-click=\"buy.confirmBuy(index.coinbaseToken, index.coinbaseAccount, buy.buyInfo)\" ng-disabled=buy.loading>\n" +
    "          Buy\n" +
    "        </button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <div class=\"m20t row text-center\" ng-show=buy.success>\n" +
    "    <div class=columns>\n" +
    "      <h1>Purchase initiated</h1>\n" +
    "      <p class=text-gray>\n" +
    "        Bitcoin purchase completed. Coinbase has queued the transfer to your selected Copay wallet.\n" +
    "      </p>\n" +
    "\n" +
    "      <button class=\"outline dark-gray round expand\" href ui-sref=coinbase>OK</button>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "</div>\n" +
    "<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/buyGlidera.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Buy'; goBackToState = 'glidera'; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<div class=\"content glidera\" ng-controller=\"buyGlideraController as buy\">\n" +
    "\n" +
    "  <div ng-show=\"index.glideraLimits  && !buy.show2faCodeInput && !buy.success\">\n" +
    "    <h4 class=\"title m0 text-left\">\n" +
    "      <span class=text-light>Daily buy limit</span>:\n" +
    "      {{index.glideraLimits.dailyBuy|currency:'':2}} {{index.glideraLimits.currency}}\n" +
    "      (remaining {{index.glideraLimits.dailyBuyRemaining|currency:'':2}} {{index.glideraLimits.currency}})\n" +
    "      <br>\n" +
    "      <span class=text-light>Monthly buy limit</span>:\n" +
    "      {{index.glideraLimits.monthlyBuy|currency:'':2}} {{index.glideraLimits.currency}}\n" +
    "      (remaining {{index.glideraLimits.monthlyBuyRemaining|currency:'':2}} {{index.glideraLimits.currency}})\n" +
    "    </h4>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"row m20t\">\n" +
    "    <div class=columns>\n" +
    "\n" +
    "      <div class=\"box-notification m20b\" ng-show=\"index.glideraLimits.transactDisabledPendingFirstTransaction  && !buy.success\">\n" +
    "        <span class=text-warning>\n" +
    "          This operation was disabled because you have a pending first transaction\n" +
    "        </span>\n" +
    "      </div>\n" +
    "\n" +
    "      <div ng-show=\"!buy.show2faCodeInput && !buy.success\">\n" +
    "\n" +
    "        <form name=buyPriceForm ng-submit=buy.get2faCode(index.glideraToken) novalidate>\n" +
    "\n" +
    "          <div ng-if=index.glideraToken ng-init=buy.init(index.glideraTestnet) ng-click=openWalletsModal(buy.allWallets)>\n" +
    "            <label>Wallet</label>\n" +
    "            <div class=input>\n" +
    "              <input id=address name=address ng-disabled=buy.selectedWalletId ng-attr-placeholder=\"{{'Choose your destination wallet'}}\" ng-model=buy.selectedWalletName required>\n" +
    "              <a class=\"postfix size-12 m0 text-gray\">\n" +
    "                <i class=\"icon-wallet size-18\"></i>\n" +
    "              </a>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "\n" +
    "          <label>Amount in {{showAlternative ? 'USD' : 'BTC'}}</label>\n" +
    "          <div class=input>\n" +
    "            <input ng-show=!showAlternative type=number id=qty ignore-mouse-wheel name=qty ng-attr-placeholder=\"{{'Amount'}}\" ng-minlength=0.00000001 ng-maxlength=10000000000 ng-model=qty autocomplete=off ng-change=\"buy.getBuyPrice(index.glideraToken, {'qty': qty})\">\n" +
    "\n" +
    "            <input ng-show=showAlternative type=number id=fiat ignore-mouse-wheel name=fiat ng-attr-placeholder=\"{{'Amount'}}\" ng-model=fiat autocomplete=off ng-change=\"buy.getBuyPrice(index.glideraToken, {'fiat': fiat})\">\n" +
    "\n" +
    "            <a ng-show=!showAlternative class=postfix ng-click=\"showAlternative = true; qty = null; buy.buyPrice = null\">BTC</a>\n" +
    "            <a ng-show=showAlternative class=postfix ng-click=\"showAlternative = false; fiat = null; buy.buyPrice = null\">USD</a>\n" +
    "\n" +
    "            <div class=\"text-center text-gray size-12 m20b\" ng-show=\"!buy.gettingBuyPrice && buy.buyPrice.qty\">\n" +
    "              Buy\n" +
    "              <span ng-show=qty>{{buy.buyPrice.subtotal|currency:'':2}} {{buy.buyPrice.currency}} in Bitcoin</span>\n" +
    "              <span ng-show=fiat>{{buy.buyPrice.qty}} BTC</span>\n" +
    "              at  {{buy.buyPrice.price}} {{buy.buyPrice.currency}}/BTC\n" +
    "            </div>\n" +
    "            <div class=\"text-center text-gray size-12 m20b\" ng-show=\"!buy.gettingBuyPrice && !buy.buyPrice.qty\">\n" +
    "              (Enter the amount to get the exchange rate)\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"text-center text-gray size-12 m20b\" ng-show=buy.gettingBuyPrice>\n" +
    "              ...\n" +
    "            </div>\n" +
    "\n" +
    "            <input class=\"button black expand round\" ng-style=\"{'background-color':index.backgroundColor}\" type=submit value=\"{{'Continue'}}\" ng-disabled=\"index.glideraLimits.transactDisabledPendingFirstTransaction || !buy.buyPrice.qty ||\n" +
    "            !buy.selectedWalletId || buy.loading\">\n" +
    "          </div>\n" +
    "        </form>\n" +
    "      </div>\n" +
    "      <div ng-show=\"buy.show2faCodeInput && !buy.success\">\n" +
    "        <div class=\"m10t text-center\">\n" +
    " {{buy.buyPrice.subtotal|currency:'':2}} {{buy.buyPrice.currency}} &rarr; {{buy.buyPrice.qty}} BTC\n" +
    "          <p class=m20t>\n" +
    "            A SMS containing a confirmation code was sent to your phone. <br>\n" +
    "            Please, enter the code below\n" +
    "          </p>\n" +
    "          <form name=buyForm ng-submit=\"buy.sendRequest(index.glideraToken, index.glideraPermissions, twoFaCode)\" novalidate>\n" +
    "              <input type=number ng-model=twoFaCode required ignore-mouse-wheel>\n" +
    "              <input class=\"button black expand round\" ng-style=\"{'background-color':index.backgroundColor}\" type=submit value=\"{{'Buy'}}\" ng-disabled=\"buyForm.$invalid || buy.loading\">\n" +
    "          </form>\n" +
    "          <p class=\"m10t size-12 text-gray\">\n" +
    "         Fiat will be immediately withdrawn from your bank account. The bitcoins will be purchased and deposited to your wallet ({{index.walletName}}) in 2-4 business days.\n" +
    "          </p>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div class=\"box-notification m20b\" ng-show=\"buy.error && !buy.success\">\n" +
    "        <span class=text-warning>\n" +
    "          {{buy.error}}\n" +
    "        </span>\n" +
    "      </div>\n" +
    "      <div class=text-center ng-show=buy.success>\n" +
    "        <h1>Purchase initiated</h1>\n" +
    "        <p class=text-gray>\n" +
    "        A transfer has been initiated from your bank account. Your bitcoins should arrive to your wallet in 2-4 business days.\n" +
    "        </p>\n" +
    "\n" +
    "        <button class=\"outline dark-gray round expand\" href ui-sref=glidera>OK</button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/coinbase.html',
    "\n" +
    "<div class=topbar-container>\n" +
    "  <nav ng-controller=\"topbarController as topbar\" class=tab-bar ng-style=\"{'background-color': '#2b71b1'}\">\n" +
    "    <section class=left-small>\n" +
    "      <a class=p10 ng-click=topbar.goHome()>\n" +
    "        <span class=text-close>Close</span>\n" +
    "      </a>\n" +
    "    </section>\n" +
    "\n" +
    "    <section class=right-small ng-show=index.coinbaseAccount>\n" +
    "      <a class=p10 href ui-sref=preferencesCoinbase>\n" +
    "        <i class=\"fi-widget size-24\"></i>\n" +
    "      </a>\n" +
    "    </section>\n" +
    "\n" +
    "    <section class=\"middle tab-bar-section\">\n" +
    "      <h1 class=\"title ellipsis\">\n" +
    "        Buy & Sell Bitcoin\n" +
    "      </h1>\n" +
    "    </section>\n" +
    "  </nav>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content coinbase p20b\" ng-controller=\"coinbaseController as coinbase\">\n" +
    "  <div class=row ng-show=\"index.coinbaseError || (index.coinbaseToken && !index.coinbaseAccount)\">\n" +
    "    <div class=\"m20b box-notification\" ng-show=index.coinbaseError>\n" +
    "      <ul class=\"no-bullet m0 text-warning size-12\">\n" +
    "        <li ng-repeat=\"err in index.coinbaseError.errors\" ng-bind-html=err.message></li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "    <div class=\"m20b box-notification\" ng-show=\"index.coinbaseToken && !index.coinbaseAccount\">\n" +
    "      <div class=text-warning>\n" +
    "        <span>Your primary account should be a WALLET. Set your wallet account as primary and try again.</span>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <div class=\"m10t text-center\">\n" +
    "      <button class=\"dark-gray outline round tiny\" ng-click=index.initCoinbase(index.coinbaseToken)>\n" +
    "        Reconnect\n" +
    "      </button>\n" +
    "      <div class=\"m20t size-12\">\n" +
    "        Or go to <a class=text-gray href ui-sref=preferencesCoinbase>Preferences</a> and log out manually.\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div ng-if=\"!index.coinbaseToken && !index.coinbaseError\" class=row>\n" +
    "    <div class=\"box-notification text-center size-12 text-warning\" ng-show=index.coinbaseTestnet>\n" +
    "      <i class=fi-info></i>\n" +
    "      Testnet wallets only work with Coinbase Sandbox Accounts\n" +
    "    </div>\n" +
    "    <div class=columns ng-init=\"showOauthForm = false\">\n" +
    "      <div class=\"text-center m20v\">\n" +
    "        <img src=img/coinbase-logo.png width=200>\n" +
    "      </div>\n" +
    "      <div class=\"text-center small-10 small-centered columns\" ng-show=!showOauthForm>\n" +
    "\n" +
    "        <p class=\"m20t text-gray size-12\">Connect your Coinbase account to get started</p>\n" +
    "\n" +
    "        <a class=\"button light-gray outline round small\" ng-click=\"coinbase.openAuthenticateWindow(); showOauthForm = true\">\n" +
    "          Connect to Coinbase\n" +
    "        </a>\n" +
    "        <div>\n" +
    "          <a href ng-click=\"showOauthForm = true\" class=\"text-gray size-12\">\n" +
    "            Do you already have the Oauth Code?\n" +
    "          </a>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div class=text-center ng-show=showOauthForm>\n" +
    "        <div class=\"text-left box-notification\" ng-show=coinbase.error>\n" +
    "          <ul class=\"no-bullet m0 text-warning size-12\">\n" +
    "            <li ng-repeat=\"err in coinbase.error.errors\" ng-bind-html=err.message></li>\n" +
    "          </ul>\n" +
    "        </div>\n" +
    "        <form name=oauthCodeForm ng-submit=coinbase.submitOauthCode(code) novalidate>\n" +
    "          <label>OAuth Code</label>\n" +
    "          <input ng-model=code ng-disabled=coinbase.loading ng-attr-placeholder=\"{{'Paste the authorization code here'}}\" required>\n" +
    "          <input class=\"button expand round\" ng-style=\"{'background-color': '#2b71b1'}\" type=submit value=\"Get started\" ng-disabled=\"oauthCodeForm.$invalid || coinbase.loading\">\n" +
    "        </form>\n" +
    "        <button class=\"button light-gray expand outline round\" ng-click=\"showOauthForm = false; index.coinbaseError = null; coinbase.error = null\">\n" +
    "          <i class=fi-arrow-left></i> <span class=tu>Back</span>\n" +
    "        </button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div ng-if=\"index.coinbaseToken && index.coinbaseAccount && !index.coinbaseError\">\n" +
    "\n" +
    "    <div class=\"p20v text-center\" ng-show=index.coinbaseAccount ng-click=\"index.updateCoinbase({updateAccount: true})\">\n" +
    "      <img src=img/coinbase-logo.png width=100>\n" +
    "    </div>\n" +
    "\n" +
    "    <ul ng-show=index.coinbaseAccount class=\"no-bullet m0 size-12\">\n" +
    "      <li class=\"line-b line-t p15 pointer\" href ui-sref=buyCoinbase>\n" +
    "        <img src=img/buy-bitcoin.svg alt=\"buy bitcoin\" width=30>\n" +
    "        <span class=\"m10 text-normal text-bold\">Buy Bitcoin</span>\n" +
    "        <span class=\"right text-gray\">\n" +
    "          <i class=\"icon-arrow-right3 size-24 right\"></i>\n" +
    "        </span>\n" +
    "      </li>\n" +
    "      <li class=\"line-b p15 pointer\" href ui-sref=sellCoinbase>\n" +
    "        <img src=img/sell-bitcoin.svg alt=\"sell bitcoin\" width=30>\n" +
    "        <span class=\"m10 text-normal text-bold\">Sell Bitcoin</span>\n" +
    "        <span class=\"right text-gray\">\n" +
    "          <i class=\"icon-arrow-right3 size-24 right\"></i>\n" +
    "        </span>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "\n" +
    "    <div ng-show=\"index.coinbasePendingTransactions && !index.coinbaseError\">\n" +
    "      <h4 class=title>Activity</h4>\n" +
    "      <div class=\"m20b box-notification\" ng-show=index.coinbasePendingError>\n" +
    "        <ul class=\"no-bullet m0 text-warning size-12\">\n" +
    "          <li ng-repeat=\"err in index.coinbasePendingError.errors\" ng-bind-html=err.message></li>\n" +
    "        </ul>\n" +
    "      </div>\n" +
    "      <div ng-repeat=\"(id, tx) in index.coinbasePendingTransactions | orderObjectBy:'updated_at':true track by $index\" ng-click=coinbase.openTxModal(tx) class=\"row collapse last-transactions-content\">\n" +
    "        <div class=\"large-2 medium-2 small-2 columns\">\n" +
    "          <img src=img/bought-pending.svg alt=bought width=24 ng-show=\"(tx.type == 'buy' || (tx.to && tx.type == 'send')) && tx.status != 'completed'\">\n" +
    "          <img src=img/bought.svg alt=bought width=30 ng-show=\"(tx.type == 'buy' || (tx.to && tx.type == 'send')) && tx.status == 'completed'\">\n" +
    "          <img src=img/sold-pending.svg alt=sold width=24 ng-show=\"tx.from && tx.type == 'send'\">\n" +
    "          <img src=img/sold.svg alt=sold width=30 ng-show=\"!tx.from && tx.type == 'sell' && tx.status == 'completed'\">\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"large-5 medium-5 small-5 columns\">\n" +
    "          <div class=\"size-12 m5t\">\n" +
    "            <span ng-show=\"tx.type == 'sell' && tx.status == 'completed'\">Sold</span>\n" +
    "            <span ng-show=\"tx.type == 'buy' && tx.status == 'completed'\">Bought</span>\n" +
    "            <span class=text-bold>\n" +
    "              <span ng-if=\"tx.type == 'sell' || (tx.type == 'send' && tx.from)\">-</span>{{tx.amount.amount.replace('-','')}}\n" +
    "              {{tx.amount.currency}}\n" +
    "            </span>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "        <div class=\"large-4 medium-4 small-4 columns text-right\">\n" +
    "          <div ng-show=tx.error class=\"m5t size-12 text-warning\">\n" +
    "            Error\n" +
    "          </div>\n" +
    "          <div ng-show=!tx.error class=\"m5t size-12 text-gray\">\n" +
    "            <div ng-show=\"tx.status == 'completed'\">\n" +
    "              <time ng-if=tx.created_at>{{tx.created_at | amTimeAgo}}</time>\n" +
    "            </div>\n" +
    "            <div ng-show=\"tx.status == 'pending'\">\n" +
    "              <span class=\"label outline gray radius text-gray text-info\" ng-if=\"tx.status == 'pending'\">Pending</span>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "        <div class=\"large-1 medium-1 small-1 columns text-right\">\n" +
    "          <i class=\"icon-arrow-right3 size-18\"></i>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=extra-margin-bottom></div>\n" +
    "</div>\n"
  );


  $templateCache.put('views/coinbaseUri.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Coinbase'; closeToHome = true\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content coinbase\" ng-controller=\"coinbaseUriController as coinbase\" ng-init=coinbase.checkCode()>\n" +
    "\n" +
    "  <div class=\"row m20t\">\n" +
    "    <div class=\"large-12 columns\">\n" +
    "      <div class=text-center>\n" +
    "        <img src=img/coinbase-logo.png ng-click=index.updateCoinbase() width=100>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"m10t text-center\" ng-show=coinbase.error>\n" +
    "        <div class=\"notification m10b size-12 text-warning\">{{coinbase.error}}</div>\n" +
    "        <button class=\"outline dark-gray tiny round\" ng-click=coinbase.submitOauthCode(coinbase.code)>Try again</button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('views/copayers.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"copayers content p20v\" ng-controller=\"copayersController as copayers\" ng-init=copayers.init()>\n" +
    "  <div ng-show=!index.notAuthorized>\n" +
    "    <h1 class=text-center translate>Share this invitation with your copayers</h1>\n" +
    "\n" +
    "    <div ng-click=copayers.copySecret(index.walletSecret) ng-class=\"{'enable_text_select': !index.isCordova}\">\n" +
    "      <div class=text-center>\n" +
    "        <qrcode size=220 error-correction-level=L data={{index.walletSecret}}></qrcode>\n" +
    "        <div ng-show=!index.walletSecret style=\"position:relative; top:-226px; height:0px\">\n" +
    "          <div style=\"height:220px; width:220px; margin:auto; background: white\">\n" +
    "            <ion-spinner class=spinner-stable icon=lines></ion-spinner>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "        <div class=secret ng-show=!index.isCordova>\n" +
    "          {{index.walletSecret || ('Loading...'|translate)}}\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-show=index.walletSecret>\n" +
    "      <div class=\"text-center m10t\" ng-if=index.isCordova>\n" +
    "        <span class=\"button outline round dark-gray tiny m0\" ng-click=copayers.shareSecret(index.walletSecret)>\n" +
    "          <i class=fi-share></i>\n" +
    "          <span translate>Share invitation</span>\n" +
    "        </span>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"m30v line-t\">\n" +
    "        <h4 class=\"size-14 p10h m10t\">\n" +
    "          <span translate>Waiting for copayers</span>\n" +
    "          <span class=\"text-gray right\">\n" +
    "            [ <span translate>{{index.m}}-of-{{index.n}}</span> ]\n" +
    "          </span>\n" +
    "        </h4>\n" +
    "        <div class=\"white line-b p10\" ng-include=\"'views/includes/copayers.html'\"></div>\n" +
    "        <div ng-if=!index.isComplete class=\"line-b p10 white size-12\">\n" +
    "          <i class=\"fi-loop m5r p10l\"></i>\n" +
    "          <span translate>Waiting...</span>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"m20b text-center\" ng-show=index.notAuthorized>\n" +
    "        <h1 translate>Wallet incomplete and broken</h1>\n" +
    "        <h4 translate>Delete it and create a new one</h4>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=text-center>\n" +
    "        <button class=\"tiny round outline dark-gray warning\" ng-click=copayers.deleteWallet()>\n" +
    "          <i class=fi-trash></i> <span translate>Cancel and delete the wallet</span>\n" +
    "        </button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=extra-margin-bottom></div>\n" +
    "</div>\n"
  );


  $templateCache.put('views/create.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Create new wallet';  goBackToState = 'add'; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content p20b\" ng-controller=\"createController as create\" ng-init=create.setTotalCopayers(1)>\n" +
    "\n" +
    "  <div class=\"create-tab small-only-text-center\" ng-hide=create.hideTabs>\n" +
    "    <div class=row>\n" +
    "      <div class=\"tab-container small-6 medium-6 large-6 columns\" ng-class=\"{'selected': totalCopayers == 1}\">\n" +
    "        <a href ng-click=create.setTotalCopayers(1) translate>Personal Wallet</a>\n" +
    "      </div>\n" +
    "      <div class=\"tab-container small-6 medium-6 large-6 columns\" ng-class=\"{'selected': totalCopayers != 1}\">\n" +
    "        <a href ng-click=create.setTotalCopayers(3) translate>Shared Wallet</a>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <form name=setupForm ng-submit=create.create(setupForm) novalidate>\n" +
    "    <div class=\"box-notification m20b\" id=notification ng-show=create.error>\n" +
    "      <span class=text-warning>\n" +
    "        {{create.error|translate}}\n" +
    "      </span>\n" +
    "    </div>\n" +
    "    <div class=row>\n" +
    "      <div class=\"large-12 columns\">\n" +
    "\n" +
    "        <div ng-hide=create.hideWalletName>\n" +
    "          <label><span translate>Wallet name</span>\n" +
    "            <div class=input>\n" +
    "              <input placeholder=\"{{'Family vacation funds'|translate}}\" class=form-control name=walletName ng-model=walletName ng-required=true ng-focus=\"create.formFocus('wallet-name')\" ng-blur=create.formFocus(false)>\n" +
    "            </div>\n" +
    "          </label>\n" +
    "        </div>\n" +
    "        <div ng-show=\"totalCopayers != 1\">\n" +
    "          <label><span translate>Your nickname</span>\n" +
    "            <div class=input>\n" +
    "              <input placeholder=\"{{'John'|translate}}\" class=form-control name=myName ng-model=myName ng-required=\"totalCopayers != 1\" ng-disabled=\"totalCopayers == 1\" ng-focus=\"create.formFocus('my-name')\" ng-blur=create.formFocus(false)>\n" +
    "            </div>\n" +
    "          </label>\n" +
    "        </div>\n" +
    "        <div class=row ng-show=\"totalCopayers != 1\">\n" +
    "          <div class=\"large-6 medium-6 columns\">\n" +
    "            <label><span translate>Total number of copayers</span>\n" +
    "              <select class=m10t ng-model=totalCopayers ng-options=\"totalCopayers as totalCopayers for totalCopayers in create.TCValues\" ng-change=create.setTotalCopayers(totalCopayers)>\n" +
    "              </select>\n" +
    "            </label>\n" +
    "          </div>\n" +
    "          <div class=\"large-6 medium-6 columns\">\n" +
    "            <label><span translate>Required number of signatures</span>\n" +
    "              <select class=m10t ng-model=requiredCopayers ng-options=\"requiredCopayers as requiredCopayers for requiredCopayers in create.RCValues\" ng-disabled=\"totalCopayers == 1\">\n" +
    "              </select>\n" +
    "            </label>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"m10t oh\" ng-init=\"hideAdv=true\">\n" +
    "          <a class=\"button outline light-gray expand tiny p10i\" ng-click=\"hideAdv=!hideAdv\">\n" +
    "            <i class=\"fi-widget m3r\"></i>\n" +
    "            <span translate ng-hide=!hideAdv>Show advanced options</span>\n" +
    "            <span translate ng-hide=hideAdv>Hide advanced options</span>\n" +
    "            <i ng-if=hideAdv class=icon-arrow-down4></i>\n" +
    "            <i ng-if=!hideAdv class=icon-arrow-up4></i>\n" +
    "          </a>\n" +
    "        </div>\n" +
    "\n" +
    "        <div ng-hide=hideAdv class=row>\n" +
    "          <div class=\"large-12 columns m20b\">\n" +
    "            <div>\n" +
    "              <label for=bws class=oh>\n" +
    "                <span>Wallet Service URL</span>\n" +
    "                <input id=bwsurl name=bwsurl ng-model=bwsurl>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "\n" +
    "            <div>\n" +
    "              <label><span translate>Wallet Key</span>\n" +
    "              <select class=m10t ng-model=seedSource ng-options=\"seed as seed.label for seed in create.seedOptions\" ng-change=create.setSeedSource()>\n" +
    "              </select>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-show=\"create.seedSourceId == 'trezor' || create.seedSourceId == 'ledger'\">\n" +
    "              <label class=oh><span translate>Account Number</span>\n" +
    "                <input type=number id=account ng-model=account ignore-mouse-wheel>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=box-notification ng-show=\"create.seedSourceId=='new' && createPassphrase\">\n" +
    "              <span class=\"text-warning size-14\">\n" +
    "                <i class=fi-alert></i>\n" +
    "                <span translate>\n" +
    "                WARNING: The password cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the password.\n" +
    "                </span>\n" +
    "              </span>\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-show=\"create.seedSourceId=='new' \">\n" +
    "              <label for=createPassphrase><span translate>Add a Password</span>  <small translate>Add an optional password to secure the recovery phrase</small>\n" +
    "                <div class=input>\n" +
    "                  <input class=form-control autocapitalize=off name=createPassphrase ng-model=createPassphrase>\n" +
    "                </div>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-show=\"create.seedSourceId=='set'\">\n" +
    "              <label for=ext-master>\n" +
    "                <span translate>Wallet Recovery Phrase</span>\n" +
    "                <small translate>Enter the recovery phrase (BIP39)</small>\n" +
    "                <input id=ext-master autocapitalize=off name=privateKey ng-model=privateKey>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-show=\"create.seedSourceId=='set'\">\n" +
    "              <label for=passphrase> <span translate>Password</span>  <small translate>The recovery phrase could require a password to be imported</small>\n" +
    "                <div class=input>\n" +
    "                  <input autocapitalize=off class=form-control name=passphrase ng-model=passphrase>\n" +
    "                </div>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-show=\"create.seedSourceId == 'set'\">\n" +
    "              <label class=oh><span translate>Derivation Path</span> <small translate>BIP32 path for address derivation</small>\n" +
    "                <input class=form-control name=derivationPath ng-model=derivationPath>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "            <div class=oh ng-show=\"create.seedSourceId == 'new'\">\n" +
    "              <ion-toggle ng-model=testnetEnabled toggle-class=toggle-balanced class=bct>\n" +
    "                <span class=toggle-label>Testnet</span>\n" +
    "              </ion-toggle>\n" +
    "            </div>\n" +
    "            <div class=oh>\n" +
    "              <ion-toggle ng-model=singleAddressEnabled toggle-class=toggle-balanced class=bct>\n" +
    "                <div class=toggle-label>\n" +
    "                  <span class=db translate>Single Address Wallet</span>\n" +
    "                  <small translate>For audit purposes</small>\n" +
    "                </div>\n" +
    "              </ion-toggle>\n" +
    "            </div>\n" +
    "          </div> \n" +
    "        </div> \n" +
    "\n" +
    "        <button type=submit class=\"button round black expand\" ng-show=\"totalCopayers != 1\" ng-disabled=setupForm.$invalid>\n" +
    "          <span translate>Create {{requiredCopayers}}-of-{{totalCopayers}} wallet</span>\n" +
    "        </button>\n" +
    "\n" +
    "        <button type=submit class=\"button round black expand\" ng-show=\"totalCopayers == 1\" ng-disabled=setupForm.$invalid>\n" +
    "          <span translate>Create new wallet</span>\n" +
    "        </button>\n" +
    "\n" +
    "      </div> \n" +
    "    </div> \n" +
    "  </form>\n" +
    "<div class=extra-margin-bottom></div>\n" +
    "</div>\n"
  );


  $templateCache.put('views/disclaimer.html',
    "<div class=\"splash extra-padding-bottom p20t content text-center\" ng-style=\"{'background-color': index.secondaryColor }\" ng-controller=\"disclaimerController as disclaimer\" ng-init=disclaimer.init()>\n" +
    "  <div class=row>\n" +
    "    <div class=\"medium-centered small-centered large-centered columns size-14\">\n" +
    "      <div class=\"cc-logo-holder negative\">\n" +
    "        <logo ng-if=!sidebar.isWindowsPhoneApp negative=true width=120></logo>\n" +
    "        <logo ng-if=sidebar.isWindowsPhoneApp negative=true width=120></logo>\n" +
    "      </div>\n" +
    "      <span class=\"text-bold text-white m10t\" translate>WELCOME TO COLU WALLET</span>\n" +
    "      <p class=\"text-gray m0 text-light\" translate>A multisignature colored coins wallet</p>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <div class=row>\n" +
    "    <div class=scrollArea ng-style=\"{'background-color': index.secondaryColor }\">\n" +
    "      <p class=\"enable_text_select m0\">\n" +
    "        </p><div class=\"size-14 text-gray\" translate>Terms of Use</div>\n" +
    "        <div ng-include=\"'views/includes/terms.html'\"></div>\n" +
    "      <p></p>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=row>\n" +
    "    <p ng-show=\"disclaimer.lang != 'en'\">\n" +
    "      <a class=center ng-click=\"$root.openExternalLink('https://copay.io/disclaimer')\" translate>Official English Disclaimer</a>\n" +
    "    </p>\n" +
    "  </div>\n" +
    "  <div>\n" +
    "      <p class=\"text-gray columns size-12\" translate>I affirm that I have read, understood, and agree with these terms.</p>\n" +
    "  </div>\n" +
    "  <div class=row>\n" +
    "\n" +
    "    <div class=\"start-button columns button-box\">\n" +
    "      <button ng-click=disclaimer.accept() class=\"button black expand round size-12 text-spacing m0\" translate>\n" +
    "        I AGREE. GET STARTED\n" +
    "      </button>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('views/export.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Export Wallet'; goBackToState = 'preferencesAdvanced'\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=exportController ng-init=init(index.prevState)>\n" +
    "  <div ng-show=!index.canSign><h4></h4></div>\n" +
    "  <div ng-show=index.canSign class=\"create-tab small-only-text-center\">\n" +
    "    <div class=row>\n" +
    "      <div class=\"tab-container small-6 columns\" ng-class=\"{'selected':!exportQR}\" ng-style=\"{'border-color':!exportQR ? index.backgroundColor: 'inherit'}\" ng-click=\"exportQR = false\">\n" +
    "        <a href ng-style=\"{'color':!exportQR ? index.backgroundColor: 'inherit'}\" translate>File/Text</a>\n" +
    "      </div>\n" +
    "      <div class=\"tab-container small-6 columns\" ng-class=\"{'selected':exportQR}\" ng-style=\"{'border-color':exportQR ? index.backgroundColor: 'inherit'}\" ng-click=\"exportQR = true\">\n" +
    "        <a href ng-style=\"{'color':exportQR ? index.backgroundColor: 'inherit'}\" translate>QR Code</a>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div ng-show=!backupWalletPlainText>\n" +
    "    <div class=\"text-warning size-14 m20b\" ng-show=error>\n" +
    "      <i class=\"fi-alert size-12\"></i>\n" +
    "      <span translate>Failed to export</span>\n" +
    "    </div>\n" +
    "\n" +
    "    <form ng-show=!exportQR>\n" +
    "      <div class=row>\n" +
    "        <div class=columns>\n" +
    "          <label for=password translate>Set up a password </label>\n" +
    "          <div class=input>\n" +
    "            <input type=password class=form-control placeholder=\"{{'Your password'|translate}}\" name=password ng-model=password>\n" +
    "          </div>\n" +
    "\n" +
    "          <label for=password translate>Repeat the password</label>\n" +
    "          <div class=input>\n" +
    "            <input type=password class=form-control placeholder=\"{{'Repeat password'|translate}}\" name=password ng-model=repeatpassword>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </form>\n" +
    "\n" +
    "    <div class=\"m20t text-gray\" ng-show=\"exportQR && supported\">\n" +
    "      <div class=\"text-center m20b\">\n" +
    "        <qrcode size=220 version=8 error-correction-level=M data={{exportWalletInfo}}></qrcode>\n" +
    "      </div>\n" +
    "      <div class=\"text-center size-12 m10\" translate>From the destination device, go to Add wallet &gt; Import wallet and scan this QR code</div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"m20t text-gray\" ng-show=\"exportQR && !supported\">\n" +
    "      <div class=\"text-center size-12 m10\" translate>Exporting via QR not supported for this wallet</div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=row ng-show=\"!exportQR && index.canSign\">\n" +
    "      <div class=\"columns m15t\">\n" +
    "        <a class=\"button outline light-gray expand tiny p10i\" ng-click=\"showAdvanced = !showAdvanced\">\n" +
    "          <i class=\"fi-widget m3r\"></i>\n" +
    "          <span translate ng-hide=showAdvanced>Show advanced options</span>\n" +
    "          <span translate ng-hide=!showAdvanced>Hide advanced options</span>\n" +
    "          <i ng-if=!showAdvanced class=icon-arrow-down4></i>\n" +
    "          <i ng-if=showAdvanced class=icon-arrow-up4></i>\n" +
    "        </a>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-show=\"showAdvanced && !exportQR\">\n" +
    "      <ion-toggle ng-model=noSignEnabled toggle-class=toggle-balanced class=r0 ng-change=noSignEnabledChange()>\n" +
    "        <span class=toggle-label translate>Do not include private key</span>\n" +
    "      </ion-toggle>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"box-notification p15l\" ng-show=!index.canSign>\n" +
    "      <span class=\"text-warning size-14\">\n" +
    "        <i class=fi-alert></i>\n" +
    "        <span translate>\n" +
    "          WARNING: The private key of this wallet is not available. The export allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.\n" +
    "        </span>\n" +
    "      </span>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"box-notification p15l\" ng-show=\"noSignEnabled && !exportQR\">\n" +
    "      <span class=\"text-warning size-14\">\n" +
    "        <i class=fi-alert></i>\n" +
    "        <span translate>\n" +
    "        WARNING: Not including the private key allows to check the wallet balance, transaction history, and create spend proposals from the export. However, does not allow to approve (sign) proposals, so <b>funds will not be accessible from the export</b>.\n" +
    "        </span>\n" +
    "      </span>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=row ng-show=!exportQR>\n" +
    "      <div class=columns>\n" +
    "        <button class=\"black round expand m20t\" ng-click=downloadWalletBackup() ng-disabled=\"(!password || password != repeatpassword)\" ng-style=\"{'background-color':index.backgroundColor}\" ng-show=\"!isSafari && !isCordova\"><i class=fi-download></i>\n" +
    "          <span translate>Download</span></button>\n" +
    "        <button class=\"black round expand m20t\" ng-click=viewWalletBackup() ng-disabled=\"(!password || password != repeatpassword)\" ng-style=\"{'background-color':index.backgroundColor}\" ng-show=\"isSafari && !isCordova\"><i class=fi-eye></i>\n" +
    "          <span translate>View</span></button>\n" +
    "        <div ng-show=isCordova>\n" +
    "          <h4 translate>Export options</h4>\n" +
    "          <button class=\"black round expand\" ng-disabled=\"(!password || password != repeatpassword)\" ng-style=\"{'background-color':index.backgroundColor}\" ng-click=copyWalletBackup()><i class=fi-clipboard-pencil></i>\n" +
    "            <span translate>Copy to clipboard</span></button>\n" +
    "          <button class=\"black round expand\" ng-disabled=\"(!password || password != repeatpassword)\" ng-style=\"{'background-color':index.backgroundColor}\" ng-click=sendWalletBackup()><i class=fi-mail></i>\n" +
    "            <span translate>Send by email</span></button>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=row ng-show=backupWalletPlainText>\n" +
    "    <div class=\"large-12 columns\">\n" +
    "      <h3 translate>Wallet Export</h3>\n" +
    "      <div class=input>\n" +
    "        <textarea rows=12>{{backupWalletPlainText}}</textarea>\n" +
    "      </div>\n" +
    "      <div class=\"size-12 text-gray text-right\">\n" +
    "        <i class=icon-compose></i>\n" +
    "        <span translate>Copy this text as it is to a safe place (notepad or email)</span>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/glidera.html',
    "\n" +
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Buy & Sell Bitcoin'; closeToHome = true; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<div class=\"content glidera p20b\" ng-controller=\"glideraController as glidera\">\n" +
    "\n" +
    "  <div class=row>\n" +
    "    <div class=\"m20b box-notification\" ng-if=index.glideraError>\n" +
    "      <div class=text-warning>\n" +
    "        <span>{{index.glideraError}}</span>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <div class=\"m10t text-center\" ng-show=index.glideraError>\n" +
    "      <button class=\"dark-gray outline round tiny\" ng-show=\"index.glideraError.indexOf('Forbidden') == 40\" ng-click=\"index.glideraToken = null; index.glideraError = null\">\n" +
    "        Request a new token\n" +
    "      </button>\n" +
    "      <div ng-show=\"index.glideraError.indexOf('Forbidden') != 40\">\n" +
    "        <button class=\"dark-gray outline round tiny\" ng-click=index.initGlidera(index.glideraToken)>\n" +
    "          Retry\n" +
    "        </button>\n" +
    "        <div class=\"m20t size-12\">\n" +
    "          <a class=text-gray href ui-sref=preferencesGlidera>Preferences</a>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div ng-if=\"!index.glideraToken && !index.glideraError\" class=row>\n" +
    "    <div class=\"box-notification text-center size-12 text-warning\" ng-show=index.glideraTestnet>\n" +
    "      <i class=fi-info></i>\n" +
    "      Testnet wallets only work with Glidera Sandbox Accounts\n" +
    "    </div>\n" +
    "    <div class=columns ng-init=\"showOauthForm = false\">\n" +
    "      <div class=\"text-center m20v\">\n" +
    "        <img src=img/glidera-logo.png ng-click=\"index.updateGlidera(index.glideraToken, index.glideraPermissions)\" width=200>\n" +
    "      </div>\n" +
    "      <div class=\"text-center small-10 small-centered columns\" ng-show=!showOauthForm>\n" +
    "        <p class=m10b>You can buy and sell Bitcoin with a US bank account directly in Copay.</p>\n" +
    "\n" +
    "        <p class=\"m20t text-gray size-12 text-left\">\n" +
    "          DISCLOSURE.<br>\n" +
    "          Glidera Inc. (Glidera) is providing the service of buying or selling bitcoins to Copay users.  To enable this\n" +
    "          service, Glidera has registered with US Treasury Department’s FinCEN as a Money Service Business\n" +
    "          (#31000042625755).  Users of Copay must agree to the service agreement presented by Glidera prior to obtaining\n" +
    "          Glidera’s service of buying or selling bitcoins. Service available in U.S. and Canada only. In U.S. (buy & sell) CA, GA, IL, KS,\n" +
    "          MA, MD, MO, MT, MN, SC, TX, AZ, CO, DE, ME, NJ, PA, TN, UT, NV, WI. In Canada (buy & sell) AB, BC, MB, NB, NL, NS, NT, NU,\n" +
    "          ON, PE, SK, YT.\n" +
    "        </p>\n" +
    "\n" +
    "        <p class=\"m20t text-gray size-12\">Connect your Glidera account to get started</p>\n" +
    "\n" +
    "        <a class=\"button light-gray outline round small\" ng-click=\"$root.openExternalLink(glidera.getAuthenticateUrl(), '_system'); showOauthForm = true\">\n" +
    "          Connect to Glidera\n" +
    "        </a>\n" +
    "        <div>\n" +
    "          <a href ng-click=\"showOauthForm = true\" class=\"text-gray size-12\">\n" +
    "            Do you already have the Oauth Code?\n" +
    "          </a>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div class=text-center ng-show=showOauthForm>\n" +
    "        <div class=\"text-left box-notification size-12 text-warning\" ng-show=glidera.error>\n" +
    "          {{glidera.error}}\n" +
    "        </div>\n" +
    "        <form name=oauthCodeForm ng-submit=glidera.submitOauthCode(code) novalidate>\n" +
    "          <label>OAuth Code</label>\n" +
    "          <input ng-model=code ng-disabled=glidera.loading ng-attr-placeholder=\"{{'Paste the authorization code here'}}\" required>\n" +
    "          <input class=\"button expand round\" ng-style=\"{'background-color':index.backgroundColor}\" type=submit value=\"Get started\" ng-disabled=\"oauthCodeForm.$invalid || glidera.loading\">\n" +
    "        </form>\n" +
    "        <button class=\"button light-gray expand outline round\" ng-click=\"showOauthForm = false; index.glideraError = null; glidera.error = null\">\n" +
    "          <i class=fi-arrow-left></i> <span class=tu>Back</span>\n" +
    "        </button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div ng-if=\"index.glideraToken && index.glideraPermissions\">\n" +
    "    <div class=\"p20v text-center white\">\n" +
    "      <img src=img/glidera-logo.png ng-click=\"index.updateGlidera(index.glideraToken, index.glideraPermissions)\" width=100>\n" +
    "    </div>\n" +
    "    <div class=sub-header href ui-sref=preferencesGlidera>\n" +
    "      <div class=left>\n" +
    "        <div ng-show=\"!index.glideraPersonalInfo && !index.glideraEmail\">\n" +
    "          Preferences\n" +
    "        </div>\n" +
    "        <div ng-show=index.glideraPersonalInfo class=size-12>\n" +
    "          <b>\n" +
    "          {{index.glideraPersonalInfo.firstName}} {{index.glideraPersonalInfo.lastName}}\n" +
    "          </b>\n" +
    "        </div>\n" +
    "        <div class=size-12 ng-show=index.glideraEmail>\n" +
    "          {{index.glideraEmail}}\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div class=right>\n" +
    "        <div class=\"pointer m5t\">\n" +
    "          <i class=\"fi-widget size-16 text-gray\"></i>\n" +
    "          <span class=\"right text-gray\">\n" +
    "            <i class=\"icon-arrow-right3 size-24 right\"></i>\n" +
    "          </span>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <div class=row>\n" +
    "      <div class=\"text-center columns small-8 small-centered m30v size-12\" ng-show=\"index.glideraStatus && !index.glideraStatus.userCanTransact\">\n" +
    "        <h4 class=text-bold> Complete Setup</h4>\n" +
    "        <div>Your Glidera account is not ready to transact. Please, verify it at <b>Glidera.io</b></div>\n" +
    "        <a class=\"button m20t light-gray outline round tiny\" ng-init=\"glideraUrl = index.glideraTestnet ? 'https://sandbox.glidera.io/login' :\n" +
    "           'https://glidera.io/login'\" ng-click=$root.openExternalLink(glideraUrl)>\n" +
    "          Go to Glidera\n" +
    "        </a>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <ul class=\"no-bullet m0 size-14\" ng-show=\"index.glideraStatus && index.glideraStatus.userCanTransact\">\n" +
    "      <li ng-show=index.glideraStatus.userCanBuy class=\"line-b line-t p20 pointer\" href ui-sref=buyGlidera>\n" +
    "        <img src=img/buy-bitcoin.svg alt=\"buy bitcoin\" width=40>\n" +
    "        <span class=\"m10 text-normal text-bold\">Buy Bitcoin</span>\n" +
    "        <span class=\"right text-gray\">\n" +
    "          <i class=\"icon-arrow-right3 size-24 right\"></i>\n" +
    "        </span>\n" +
    "      </li>\n" +
    "      <li class=\"line-b p20 pointer\" ng-show=index.glideraStatus.userCanSell href ui-sref=sellGlidera>\n" +
    "        <img src=img/sell-bitcoin.svg alt=\"buy bitcoin\" width=40>\n" +
    "        <span class=\"m10 text-normal text-bold\">Sell Bitcoin</span>\n" +
    "        <span class=\"right text-gray\">\n" +
    "          <i class=\"icon-arrow-right3 size-24 right\"></i>\n" +
    "        </span>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "\n" +
    "    <div ng-show=index.glideraPermissions.transaction_history>\n" +
    "      <h4>Activity</h4>\n" +
    "      <div ng-show=\"index.glideraTxs.length == 0 \" class=\"size-12 p10 text-center text-gray\">\n" +
    "        No activity in your account\n" +
    "      </div>\n" +
    "      <div ng-repeat=\"tx in index.glideraTxs\" ng-click=\"glidera.openTxModal(index.glideraToken, tx)\" class=\"row collapse last-transactions-content\">\n" +
    "        <div class=\"large-3 medium-3 small-3 columns\">\n" +
    "          <img src=img/bought.svg alt=bought width=39 ng-show=\"tx.type == 'BUY' && tx.status == 'COMPLETE'\">\n" +
    "          <img src=img/bought-pending.svg alt=bought width=33 ng-show=\"tx.type == 'BUY' && tx.status == 'PROCESSING'\">\n" +
    "          <img src=img/sold.svg alt=bought width=39 ng-show=\"tx.type == 'SELL' && tx.status == 'COMPLETE'\">\n" +
    "          <img src=img/sold-pending.svg alt=bought width=33 ng-show=\"tx.type == 'SELL' && tx.status == 'PROCESSING'\">\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"large-4 medium-4 small-4 columns\">\n" +
    "          <div class=size-14>\n" +
    "            <span ng-show=\"tx.type == 'BUY'\">Bought</span>\n" +
    "            <span ng-show=\"tx.type == 'SELL'\">Sold</span>\n" +
    "            <b>{{tx.qty}}</b> BTC\n" +
    "          </div>\n" +
    "          <span class=\"size-14 text-bold\">\n" +
    "            {{tx.subtotal|currency:'':2}} {{tx.currency}}\n" +
    "          </span>\n" +
    "        </div>\n" +
    "        <div class=\"large-4 medium-4 small-4 columns text-right\">\n" +
    "          <div class=\"m5t size-12 text-gray\">\n" +
    "            <div ng-show=\"tx.status == 'COMPLETE'\">\n" +
    "              <time ng-if=tx.transactionDate>{{tx.transactionDate | amTimeAgo}}</time>\n" +
    "            </div>\n" +
    "            <div ng-show=\"tx.status == 'PROCESSING'\">\n" +
    "              <span class=\"label outline gray radius text-gray text-info\" ng-if=\"tx.status == 'PROCESSING'\">Processing</span>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "        <div class=\"large-1 medium-1 small-1 columns text-right\">\n" +
    "          <i class=\"icon-arrow-right3 size-18\"></i>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "  </div>\n" +
    "\n" +
    "<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/glideraUri.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Glidera'; closeToHome = true\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content glidera\" ng-controller=\"glideraUriController as glidera\" ng-init=glidera.checkCode()>\n" +
    "\n" +
    "  <div class=\"row m20t\">\n" +
    "    <div class=\"large-12 columns\">\n" +
    "      <div class=text-center>\n" +
    "        <img src=img/glidera-logo.png ng-click=index.updateGlidera() width=100>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"m10t text-center\" ng-show=glidera.error>\n" +
    "        <div class=\"notification m10b size-12 text-warning\">{{glidera.error}}</div>\n" +
    "        <button class=\"outline dark-gray tiny round\" ng-click=glidera.submitOauthCode(glidera.code)>Try again</button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('views/import.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Import wallet';  goBackToState = 'add'; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content p20b\" ng-controller=importController ng-init=\"type='12'\">\n" +
    "  <div class=\"create-tab pr small-only-text-center\" ng-hide=create.hideTabs>\n" +
    "    <div class=row>\n" +
    "      <div class=\"tab-container small-4 medium-4 large-4\" ng-class=\"{'selected': type =='12'}\">\n" +
    "        <a href ng-click=\"setType('12')\" translate>Recovery Phrase</a>\n" +
    "      </div>\n" +
    "      <div class=\"tab-container small-4 medium-4 large-4\" ng-class=\"{'selected': type=='file'}\">\n" +
    "        <a href ng-click=\"setType('file')\" translate>File/Text</a>\n" +
    "      </div>\n" +
    "      <div class=\"tab-container small-4 medium-4 large-4\" ng-class=\"{'selected': type=='hwWallet'}\">\n" +
    "        <a href ng-click=\"setType('hwWallet')\" translate>Hardware Wallet</a>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div ng-show=\"type == '12' \">\n" +
    "\n" +
    "    <div class=row ng-click=\"importErr = error = null\">\n" +
    "      <div class=\"large-12 columns\">\n" +
    "        <div class=\"box-notification m20b\" ng-show=importErr>\n" +
    "          <div class=text-warning>\n" +
    "            <div class=\"m10 text-bold\" translate>Could not access the wallet at the server. Please check:</div>\n" +
    "            <ul class=size-12>\n" +
    "              <li translate>The password of the recovery phrase (if set)</li>\n" +
    "              <li translate>The derivation path</li>\n" +
    "              <li translate>The wallet service URL</li>\n" +
    "            </ul>\n" +
    "            <div class=m15l>\n" +
    "              <span translate>NOTE: To import a wallet from a 3rd party software, please go to Add Wallet &gt; Create Wallet, and specify the Recovery Phrase there.</span><br>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"box-notification m20b\" ng-show=error>\n" +
    "          <div class=text-warning>{{error|translate}}</div>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=row>\n" +
    "      <div class=\"large-12 columns\">\n" +
    "        <form name=importForm12 ng-submit=importMnemonic(importForm12) novalidate>\n" +
    "          <label for=words class=m25r>\n" +
    "            <span translate>Type the Recovery Phrase (usually 12 words)</span>:\n" +
    "          </label>\n" +
    "\n" +
    "          <div class=qr-scanner-input-import>\n" +
    "            <qr-scanner on-scan=processWalletInfo(data)></qr-scanner>\n" +
    "          </div>\n" +
    "\n" +
    "          <textarea class=\"form-control m10t\" name=words ng-model=words rows=3 autocapitalize=off spellcheck=false></textarea>\n" +
    "\n" +
    "          <div class=\"m10t oh\" ng-init=\"hideAdv=true\">\n" +
    "            <a class=\"button outline light-gray expand tiny p10i\" ng-click=\"hideAdv=!hideAdv\">\n" +
    "              <i class=\"fi-widget m3r\"></i>\n" +
    "              <span translate ng-hide=!hideAdv>Show advanced options</span>\n" +
    "              <span translate ng-hide=hideAdv>Hide advanced options</span>\n" +
    "              <i ng-if=hideAdv class=icon-arrow-down4></i>\n" +
    "              <i ng-if=!hideAdv class=icon-arrow-up4></i>\n" +
    "            </a>\n" +
    "          </div>\n" +
    "\n" +
    "          <div ng-hide=hideAdv class=row>\n" +
    "            <div class=\"large-12 columns\">\n" +
    "              <label for=passphrase class=oh><span translate>Password</span>  <small translate>The Wallet Recovery Phrase could require a password to be imported</small>\n" +
    "                <div class=input>\n" +
    "                  <input type=password class=form-control placeholder=\"{{'Password'|translate}}\" name=passphrase ng-model=passphrase>\n" +
    "                </div>\n" +
    "              </label>\n" +
    "\n" +
    "              <div>\n" +
    "                <label class=oh><span translate>Derivation Path</span> <small translate>BIP32 path for address derivation</small>\n" +
    "                  <input class=form-control name=derivationPath ng-model=derivationPath>\n" +
    "                </label>\n" +
    "              </div>\n" +
    "\n" +
    "              <label for=bws class=oh>\n" +
    "                <span>Wallet Service URL</span>\n" +
    "                <input id=bwsurl name=bwsurl ng-model=bwsurl>\n" +
    "              </label>\n" +
    "\n" +
    "              <div class=oh>\n" +
    "                <ion-toggle ng-model=testnetEnabled ng-change=setDerivationPath() toggle-class=toggle-balanced class=bct>\n" +
    "                  <span class=toggle-label>Testnet</span>\n" +
    "                </ion-toggle>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "\n" +
    "          <button translate type=submit class=\"button round expand black m10t\" ng-disabled=importForm12.$invalid>Import</button>\n" +
    "        </form>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div ng-show=\"type == 'file' \">\n" +
    "    <div class=row>\n" +
    "      <div class=\"large-12 columns\">\n" +
    "        <div class=\"box-notification m20b\" ng-show=error>\n" +
    "          <span class=\"text-warning size-14\">\n" +
    "            {{error|translate}}\n" +
    "          </span>\n" +
    "        </div>\n" +
    "        <form name=importForm ng-submit=importBlob(importForm) novalidate>\n" +
    "\n" +
    "          <div ng-show=\"!index.isSafari && !index.isCordova\" class=\"line-b m10b\">\n" +
    "            <label for=backupFile>\n" +
    "              <span translate>Choose a backup file from your computer</span>  <i class=fi-laptop></i>\n" +
    "            </label>\n" +
    "            <input type=file class=form-control placeholder=\"{{'Select a backup file'|translate}}\" name=backupFile ng-model=backupFile ng-file-select>\n" +
    "          </div>\n" +
    "\n" +
    "          <div ng-show=\"index.isSafari || index.isCordova\">\n" +
    "            <label for=backupText>\n" +
    "              <span translate>Paste the backup plain text code</span>  <i class=fi-clipboard></i>\n" +
    "            </label>\n" +
    "            <textarea class=form-control name=backupText ng-model=backupText rows=5></textarea>\n" +
    "          </div>\n" +
    "\n" +
    "          <label for=password><span translate>Password</span>\n" +
    "          </label>\n" +
    "          <div class=input>\n" +
    "            <input type=password class=form-control placeholder=\"{{'Your password'|translate}}\" name=password ng-model=password>\n" +
    "          </div>\n" +
    "\n" +
    "          <div class=\"m10t oh\" ng-init=\"hideAdv=true\">\n" +
    "            <a class=\"button outline light-gray expand tiny p10i\" ng-click=\"hideAdv=!hideAdv\">\n" +
    "              <i class=\"fi-widget m3r\"></i>\n" +
    "              <span translate ng-hide=!hideAdv>Show advanced options</span>\n" +
    "              <span translate ng-hide=hideAdv>Hide advanced options</span>\n" +
    "              <i ng-if=hideAdv class=icon-arrow-down4></i>\n" +
    "              <i ng-if=!hideAdv class=icon-arrow-up4></i>\n" +
    "            </a>\n" +
    "          </div>\n" +
    "          <div ng-hide=hideAdv class=row>\n" +
    "            <div class=\"large-12 columns\">\n" +
    "\n" +
    "              <label for=bws class=oh>\n" +
    "                <span>Wallet Service URL</span>\n" +
    "                <input id=bwsurl name=bwsurl ng-model=bwsurl>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "\n" +
    "          <button translate type=submit class=\"button round expand black\" ng-disabled=\"importForm.$invalid || !password \">\n" +
    "            Import backup\n" +
    "          </button>\n" +
    "        </form>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div ng-show=\"type == 'hwWallet'\">\n" +
    "    <div class=row>\n" +
    "      <div class=\"large-12 columns\">\n" +
    "        <div class=\"box-notification m20b\" ng-show=error>\n" +
    "          <span class=\"text-warning size-14\">\n" +
    "            {{error|translate}}\n" +
    "          </span>\n" +
    "        </div>\n" +
    "\n" +
    "        <form name=importForm3 ng-submit=importHW(importForm3) novalidate>\n" +
    "          <div ng-show=!seedOptions[0]>\n" +
    "            <span translate>No hardware wallets supported on this device</span>\n" +
    "          </div>\n" +
    "          <div ng-show=seedOptions[0]>\n" +
    "            <div>\n" +
    "              <label><span translate>Wallet Type</span>\n" +
    "              <select class=m10t ng-model=seedSource ng-options=\"seed as seed.label for seed in seedOptions\" ng-change=setSeedSource()>\n" +
    "              </select>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-show=\"seedSourceId == 'trezor' || seedSourceId == 'ledger'\">\n" +
    "\n" +
    "              <label class=oh><span translate>Account Number</span>\n" +
    "                <input type=number id=account ng-model=account ignore-mouse-wheel>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=oh ng-show=\"seedSourceId == 'trezor'\">\n" +
    "              <ion-toggle ng-model=isMultisig toggle-class=toggle-balanced class=bct>\n" +
    "                <span class=toggle-label translate>Shared Wallet</span>\n" +
    "              </ion-toggle>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"m10t oh\" ng-init=\"hideAdv=true\">\n" +
    "              <a class=\"button outline light-gray expand tiny p10i\" ng-click=\"hideAdv=!hideAdv\">\n" +
    "                <i class=\"fi-widget m3r\"></i>\n" +
    "                <span translate ng-hide=!hideAdv>Show advanced options</span>\n" +
    "                <span translate ng-hide=hideAdv>Hide advanced options</span>\n" +
    "                <i ng-if=hideAdv class=icon-arrow-down4></i>\n" +
    "                <i ng-if=!hideAdv class=icon-arrow-up4></i>\n" +
    "              </a>\n" +
    "            </div>\n" +
    "            <div ng-hide=hideAdv class=row>\n" +
    "              <div class=\"large-12 columns\">\n" +
    "\n" +
    "                <label for=bws class=oh>\n" +
    "                  <span>Wallet Service URL</span>\n" +
    "                  <input id=bwsurl name=bwsurl ng-model=bwsurl>\n" +
    "                </label>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <button translate type=submit class=\"button round expand black\">\n" +
    "              Import\n" +
    "            </button>\n" +
    "          </div> \n" +
    "        </form>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/includes/alert.html',
    "<div class=\"columns m20t\">\n" +
    "  <div class=\"m20t size-14 text-center\">\n" +
    "      <i class=fi-alert></i>\n" +
    "      {{msg|translate}}\n" +
    "  </div>\n" +
    "<div class=\"text-center m20t\" ng-click=close()>\n" +
    "    <a class=\"button outline light-gray round tiny small-4\">OK</a>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('views/includes/available-balance.html',
    "<div>\n" +
    "  <span class=\"db text-bold\">\n" +
    "    <span translate>Available Balance</span>:\n" +
    "    {{index.availableBalanceStr }}\n" +
    "  </span>\n" +
    "  <span class=text-gray ng-show=index.lockedBalanceSat>\n" +
    "    {{index.lockedBalanceStr}}\n" +
    "    <span translate>locked by pending payments</span>\n" +
    "  </span>\n" +
    "</div>\n"
  );


  $templateCache.put('views/includes/clientError.html',
    ""
  );


  $templateCache.put('views/includes/confirm-tx.html',
    "<div class=m20t>\n" +
    "  <label class=\"size-14 text-center\">\n" +
    "    <span translate>Send bitcoin</span>\n" +
    "  </label>\n" +
    "</div>\n" +
    "<div class=text-center>\n" +
    "  <div class=size-36>{{tx.amountStr}}</div>\n" +
    "  <div class=\"size-12 label gray radius\" ng-show=tx.alternativeAmountStr>{{tx.alternativeAmountStr}}</div>\n" +
    "  <i class=\"db fi-arrow-down size-24 m10v\"></i>\n" +
    "  <div class=payment-proposal-to ng-click=\"copyToClipboard(tx.toAddress, $event)\">\n" +
    "    <i class=\"fi-bitcoin left m10l\"></i>\n" +
    "    <contact ng-if=!tx.hasMultiplesOutputs class=\"dib enable_text_select ellipsis m5t m5b m15l size-14\" address={{tx.toAddress}}></contact>\n" +
    "    <span ng-if=tx.hasMultiplesOutputs translate>\n" +
    "      Multiple recipients\n" +
    "    </span>\n" +
    "  </div>\n" +
    "  <div class=\"m10t size-12\" ng-init=\"processFee(tx.amount, tx.fee)\">\n" +
    "    <div ng-show=!showPercentage ng-click=\"showPercentage = true\">\n" +
    "      <span translate>Fee</span> <span class=tl>({{feeLevel|translate}})</span>:\n" +
    "      <span class=text-bold>{{tx.feeStr}}</span>\n" +
    "      <span class=\"label gray radius\">{{feeAlternativeStr}}</span>\n" +
    "    </div>\n" +
    "    <div ng-show=showPercentage ng-click=\"showPercentage = false\" translate>\n" +
    "      {{feeRateStr}} of the transaction\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <div class=\"row m20t dib\">\n" +
    "    <div class=\"half-row left\">\n" +
    "      <button ng-click=cancel() class=\"round outline dark-gray expand\">\n" +
    "        <span class=size-12 translate>Cancel</span>\n" +
    "      </button>\n" +
    "    </div>\n" +
    "    <div class=\"half-row left\">\n" +
    "      <button ng-click=accept() class=\"round expand\" ng-style=\"{'background-color': color}\" autofocus>\n" +
    "        <span class=size-12 translate>Confirm</span>\n" +
    "      </button>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('views/includes/copayers.html',
    "<ul class=\"no-bullet m0\">\n" +
    "  <li ng-repeat=\"copayer in index.copayers\">\n" +
    "  <span class=size-12 ng-show=\"copayer.id == index.copayerId\">\n" +
    "    <i class=\"fi-check m5r\"></i> {{'Me'|translate}}\n" +
    "  </span>\n" +
    "  <span class=\"size-12 text-gray\" ng-show=\"copayer.id != index.copayerId\">\n" +
    "    <i class=\"fi-check m5r\"></i> {{copayer.name}}\n" +
    "  </span>\n" +
    "  </li>\n" +
    "</ul>\n"
  );


  $templateCache.put('views/includes/copyToClipboard.html',
    "<ion-popover-view>\n" +
    "<div class=\"columns m20t\" ng-click=close()>\n" +
    "  <label class=\"size-10 text-center m20b\">\n" +
    "    <span translate>Copied to clipboard</span>\n" +
    "  </label>\n" +
    "</div>\n" +
    "</ion-popover-view>\n"
  );


  $templateCache.put('views/includes/menu-item.html',
    "<a ng-click=\"index.setTab(item, false, 0, true)\" ng-style=\"{'color': index.tab == item.link ? index.backgroundColor : '#A5B2BF'}\" id=menu-{{item.link}}>\n" +
    "    <i class=\"size-18 {{item.icon[index.tab == item.link]}} db\"></i>\n" +
    "    <span class=\"size-10 tu\">\n" +
    "        {{ item.title|translate }}\n" +
    "        <span class=\"label round\" ng-style=\"{'background-color':index.backgroundColor}\" ng-if=\"item.link=='walletHome' && index.pendingTxProposalsCountForUs > 0\">\n" +
    "            {{ index.pendingTxProposalsCountForUs }}\n" +
    "        </span>\n" +
    "    </span>\n" +
    "    <div ng-if=\"item.link == 'walletHome'\" class=menu-wallet-home></div>\n" +
    "</a>\n"
  );


  $templateCache.put('views/includes/menu-toggle.html',
    "<div class=\"medium-2 small-2 columns text-center bottombar-item\">\n" +
    "    <a ng-click=\"showPlugins ? showPlugins = false : showPlugins = true\" class=menu-toggle>\n" +
    "        <i class=\"size-24 db\" ng-class=\"{ 'icon-arrow-left': showPlugins, 'icon-arrow-right' : !showPlugins }\"> </i>\n" +
    "    </a>\n" +
    "</div>\n"
  );


  $templateCache.put('views/includes/menu.html',
    "<div class=\"bottom-bar row collapse p0i\" ng-show=!index.notAuthorized>\n" +
    "    <div>\n" +
    "        <div class=\"row collapse p0i\">\n" +
    "            <div class=\"medium-4 small-4 columns text-center bottombar-item\" ng-repeat=\"item in index.menu\">\n" +
    "              <span ng-include=\"'views/includes/menu-item.html'\"></span>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n"
  );


  $templateCache.put('views/includes/note.html',
    "<div class=\"columns m20t\">\n" +
    "  <label class=\"size-14 text-center\">\n" +
    "    <span ng-show=!comment translate>Add comment</span>\n" +
    "    <span ng-show=comment translate>Edit comment</span>\n" +
    "  </label>\n" +
    "  <input ng-model=data.comment autofocus>\n" +
    "</div>\n" +
    "<div class=\"row m20t dib\">\n" +
    "  <div class=\"half-row left\">\n" +
    "    <button class=\"round outline dark-gray expand\" ng-click=commentPopupClose() translate>Cancel</button>\n" +
    "  </div>\n" +
    "  <div class=\"half-row left\">\n" +
    "    <button ng-style=\"{'background-color': index.backgroundColor}\" class=\"round outline expand\" ng-click=commentPopupSave() translate>Save</button>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('views/includes/notifications.html',
    "<div class=dr-notification-wrapper ng-repeat=\"noti in queue\" ng-click=removeNotification(noti)>\n" +
    "  <div class=\"dr-notification animated bounceInDown\">\n" +
    "    <div class=dr-notification-image ng-switch on=noti.image>\n" +
    "      <i class={{noti.icon}} ng-switch-when=false></i>\n" +
    "      <img ng-src={{noti.image}} ng-switch-default/>\n" +
    "    </div>\n" +
    "    <div class=dr-notification-content>\n" +
    "      <h3 class=dr-notification-title>{{noti.title|translate}}</h3>\n" +
    "      <div class=\"dr-notification-text label radius\" ng-show=noti.userData.color ng-style=\"{'background-color':noti.userData.color}\">{{noti.content|translate}}\n" +
    "      </div>\n" +
    "      <div class=dr-notification-text ng-show=!noti.userData.color>{{noti.content|translate}}\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n"
  );


  $templateCache.put('views/includes/offline.html',
    ""
  );


  $templateCache.put('views/includes/output.html',
    "<li class=\"p10 oh\" ng-click=\"copyToClipboard(output.toAddress, $event)\">\n" +
    "  <span class=text-gray translate>To</span>:\n" +
    "  <span class=\"right enable_text_select\">{{output.toAddress || output.address}}</span>\n" +
    "</li>\n" +
    "<li class=p10 ng-click=\"copyToClipboard(output.amountStr, $event)\">\n" +
    "  <span class=text-gray translate>Amount</span>:\n" +
    "  <span class=\"right enable_text_select\">{{output.amountStr}}\n" +
    "    <span ng-show=output.alternativeAmountStr class=\"label gray radius\">{{output.alternativeAmountStr}}</span>\n" +
    "  </span>\n" +
    "</li>\n" +
    "<li class=\"p10 oh\" ng-click=\"copyToClipboard(output.message, $event)\">\n" +
    "  <span class=text-gray translate>Note</span>:\n" +
    "  <span class=\"right enable_text_select\">{{output.message}}</span>\n" +
    "</li>\n"
  );


  $templateCache.put('views/includes/password.html',
    "\n" +
    "  <div class=\"columns m20t\">\n" +
    "    <label class=\"size-14 text-center\" for=password ng-if=isSetup>\n" +
    "      <span ng-show=!isVerification translate>Set up a spending password</span>\n" +
    "      <span ng-show=isVerification translate>Repeat the spending password</span>\n" +
    "    </label>\n" +
    "    <label class=\"size-14 text-center\" for=password ng-if=!isSetup>\n" +
    "      <span translate>Enter your spending password</span>\n" +
    "    </label>\n" +
    "\n" +
    "    <div class=\"input m20t\">\n" +
    "      <input type=password placeholder=\"{{'Your spending password'|translate}}\" id=passwordInput name=password ng-model=data.password ng-keypress=keyPress($event) autofocus>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <div class=row>\n" +
    "    <div class=\"small-6 columns\">\n" +
    "      <button class=\"round small-6 columns outline dark-gray expand\" ng-click=cancel() ng-disabled=loading>\n" +
    "        <span class=size-12 translate>Cancel</span>\n" +
    "      </button>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"small-6 columns\">\n" +
    "      <button class=\"round expand\" ng-click=set() ng-disabled=\"!data.password || loading\" ng-style=\"{'background-color':index.backgroundColor}\">\n" +
    "        <span ng-if=isSetup class=size-12 translate>SET</span>\n" +
    "        <span ng-if=!isSetup class=size-12>OK</span>\n" +
    "      </button>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "    <p class=\"text-warning size-12 columns m20t text-center\" ng-show=isSetup>\n" +
    "      <i class=fi-alert></i>\n" +
    "      <span ng-show=!error translate> Your wallet key will be encrypted. The Spending Password cannot be recovered. Be sure to write it down</span>\n" +
    "\n" +
    "      <span ng-show=error>{{error|translate}}</span>\n" +
    "    </p>\n"
  );


  $templateCache.put('views/includes/progressReport.html',
    "<div class=onGoingProcess ng-show=index.isOffline>\n" +
    "  <div class=onGoingProcess-content ng-style=\"{'background-color':'#222'}\">\n" +
    "    <div class=spinner>\n" +
    "      <div class=rect1></div>\n" +
    "      <div class=rect2></div>\n" +
    "      <div class=rect3></div>\n" +
    "      <div class=rect4></div>\n" +
    "      <div class=rect5></div>\n" +
    "    </div>\n" +
    "    <span translate>Reconnecting to Wallet Service...</span>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=onGoingProcess ng-show=\"index.anyOnGoingProcess && !index.isOffline\">\n" +
    "  <div class=onGoingProcess-content ng-style=\"{'background-color':index.backgroundColor}\">\n" +
    "    <div class=spinner>\n" +
    "      <div class=rect1></div>\n" +
    "      <div class=rect2></div>\n" +
    "      <div class=rect3></div>\n" +
    "      <div class=rect4></div>\n" +
    "      <div class=rect5></div>\n" +
    "    </div>\n" +
    "    <span translate ng-show=\"\n" +
    "      index.onGoingProcessName == 'openingWallet'\n" +
    "      || index.onGoingProcessName == 'updatingStatus'\n" +
    "      || index.onGoingProcessName == 'updatingBalance'\n" +
    "      || index.onGoingProcessName == 'updatingPendingTxps'\n" +
    "      \"> Updating Wallet... </span>\n" +
    "    <span translate ng-show=\"index.onGoingProcessName == 'scanning'\">Scanning Wallet funds...</span>\n" +
    "    <span translate ng-show=\"index.onGoingProcessName == 'recreating'\">Recreating Wallet...</span>\n" +
    "    <span translate ng-show=\"index.onGoingProcessName == 'generatingCSV'\">Generating .csv file...</span>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=onGoingProcess ng-show=\"home.onGoingProcess && !index.anyOnGoingProces && !index.isOffline\">\n" +
    "  <div class=onGoingProcess-content ng-style=\"{'background-color':index.backgroundColor}\">\n" +
    "    <div class=spinner>\n" +
    "      <div class=rect1></div>\n" +
    "      <div class=rect2></div>\n" +
    "      <div class=rect3></div>\n" +
    "      <div class=rect4></div>\n" +
    "      <div class=rect5></div>\n" +
    "    </div>\n" +
    "    {{home.onGoingProcess}}...\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=onGoingProcess ng-show=\"!home.onGoingProcess && index.onGoingProcessName && !index.anyOnGoingProcess && !index.isOffline\">\n" +
    "  <div class=onGoingProcess-content ng-style=\"{'background-color':index.backgroundColor}\">\n" +
    "    <div class=spinner>\n" +
    "      <div class=rect1></div>\n" +
    "      <div class=rect2></div>\n" +
    "      <div class=rect3></div>\n" +
    "      <div class=rect4></div>\n" +
    "      <div class=rect5></div>\n" +
    "    </div>\n" +
    "    {{index.onGoingProcessName|translate}}...\n" +
    "  </div>\n" +
    "</div>"
  );


  $templateCache.put('views/includes/sidebar.html',
    "<div class=sidebar ng-controller=\"sidebarController as sidebar\" style=\"background-color: {{index.secondaryColor}}\">\n" +
    "  <header>\n" +
    "    <div class=\"cc-logo-holder negative\">\n" +
    "      <logo ng-if=!sidebar.isWindowsPhoneApp negative=true width=120></logo>\n" +
    "      <logo ng-if=sidebar.isWindowsPhoneApp negative=true width=120></logo>\n" +
    "    </div>\n" +
    "    <div ng-include=\"'views/includes/version.html'\"></div>\n" +
    "  </header>\n" +
    "  <ion-content style=\"background-color: {{index.secondaryColor}}\">\n" +
    "    <ul class=pr>\n" +
    "      <li ng-show=sidebar.wallets[0] ng-repeat=\"item in sidebar.wallets track by $index\" ng-class=\"{'selected': item.id == index.walletId}\" class=nav-item menu-toggle href ui-sref=walletHome on-tap=\"sidebar.switchWallet(item.id, index.walletId)\">\n" +
    "        <div class=avatar-wallet ng-style=\"{'background-color':item.color}\">\n" +
    "          <i class=\"icon-wallet size-21\"></i>\n" +
    "        </div>\n" +
    "        <div class=name-wallet ng-class=\"{'m8t':item.n == 1}\">{{item.name || item.id}}</div>\n" +
    "        <div class=size-12 ng-show=\"item.n > 1\" translate>{{item.m}}-of-{{item.n}}</div>\n" +
    "      </li>\n" +
    "      <li menu-toggle href ui-sref=add>\n" +
    "          <i class=\"icon-arrow-right3 size-18 right m10t vm\"></i>\n" +
    "          <i class=\"fi-plus size-24 icon vm\"></i>\n" +
    "          <div class=\"tu text-bold\">\n" +
    "            <span class=size-12 translate>Add wallet</span>\n" +
    "          </div>\n" +
    "          <div translate>Create, join or import</div>\n" +
    "      </li>\n" +
    "      <li ng-show=\"index.asset.isAsset === false && !index.noFocusedWallet && !index.isWindowsPhoneApp && (index.glideraEnabled || index.coinbaseEnabled)\" menu-toggle href ui-sref=buyandsell>\n" +
    "          <i class=\"icon-arrow-right3 size-18 right m10t vm\"></i>\n" +
    "          <i class=\"icon-bank size-24 icon vm\"></i>\n" +
    "          <div class=\"tu text-bold m5t\">\n" +
    "            <span class=size-12 translate>Buy and Sell</span>\n" +
    "          </div>\n" +
    "      </li>\n" +
    "      <li menu-toggle href ui-sref=amazon ng-show=\"index.isComplete && index.asset.isAsset === false\">\n" +
    "        <i class=\"icon-arrow-right3 size-18 right m10t vm\"></i>\n" +
    "        <i class=\"fi-shopping-bag size-24 icon vm\"></i>\n" +
    "        <div class=\"tu text-bold m10t\">\n" +
    "          <span class=size-12 translate>Gift Cards</span>\n" +
    "        </div>\n" +
    "      </li>\n" +
    "      <li ng-show=!index.noFocusedWallet menu-toggle href ui-sref=preferencesGlobal>\n" +
    "          <i class=\"icon-arrow-right3 size-18 right m10t vm\"></i>\n" +
    "          <i class=\"fi-widget size-24 icon vm\"></i>\n" +
    "          <div class=\"tu text-bold\">\n" +
    "            <span class=size-12 translate>Settings</span>\n" +
    "          </div>\n" +
    "          <div translate>Global preferences</div>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "  </ion-content>\n" +
    "</div>\n"
  );


  $templateCache.put('views/includes/terms.html',
    "<div class=cc-disclaimer>\n" +
    "    <p>The Copay Colored Coins wallet is meant for testing purposes and provided AS-IS.</p>\n" +
    "    <p>USE AT YOUR OWN RISK.</p>\n" +
    "    <p><b>No Warranty:</b> Colored Coins does not warrant for Software and supplies it on an “as-is” and “as-available” basis. Your Use of Software is at your own risk and under your liability. Colored Coins makes no warranty that (i) the Software will meet your requirements, including providing you with any relevant information or reaching a relevant audience and (ii) the Software will be uninterrupted, timely, secure, or error-free and (iii) the results that may be obtained from the Use of the Software will be accurate or reliable and (iv) the quality of any products, services, information, or other material purchased or obtained by You through Software will meet your expectations, or (v) any errors in the Software will be corrected.</p>\n" +
    "    <p><b>Liability:</b> For no case and for no reason shall Colored Coins be held liable for any damage, direct or indirect, consequential, exemplary, physical or special, to You, any User or any 3rd party due to its misperformance of duties herein. Colored Coins provides the Software on an AS-IS basis and shall not be held liable, to the extent permitted by law, by any case of misconduct, negligence, gross negligence, malice or any other mean, to any damages or loss of property, including damages to: virtual property, reputation and business reputation, user account information including login information, loss of profit, loss of good name, all resulting from the use or inability to use Software rendered by Colored Coins.</p>\n" +
    "</div>\n"
  );


  $templateCache.put('views/includes/topbar.html',
    "<nav ng-controller=\"topbarController as topbar\" class=tab-bar ng-style=\"{'background-color': noColor ? index.secondaryColor : index.backgroundColor}\">\n" +
    "  <section class=left-small>\n" +
    "    <a id=hamburger class=p10 ng-show=\"!goBackToState && !closeToHome  && !index.noFocusedWallet && index.physicalScreenWidth < 768\" on-tap=index.toggleLeftMenu()><i class=\"fi-list size-24\"></i>\n" +
    "    </a>\n" +
    "    <a ng-show=goBackToState ng-click=\"$root.go(goBackToState); goBackToState = null\"><i class=\"icon-arrow-left3 icon-back\"></i>\n" +
    "      <span class=text-back translate>Back</span>\n" +
    "    </a>\n" +
    "\n" +
    "    <a ng-show=closeToHome class=p10 ng-click=\"topbar.goHome(); index.setCompactTxHistory(); closeToHome = null\">\n" +
    "      <span class=text-close translate>Close</span>\n" +
    "    </a>\n" +
    "  </section>\n" +
    "\n" +
    "  <section class=right-small ng-show=\"showPreferences && !index.noFocusedWallet\">\n" +
    "    <a class=p10 ng-show=index.allowAssetChange ng-click=index.openWalletInfo()>\n" +
    "      <i class=\"fi-bitcoin-circle size-24\"></i>\n" +
    "    </a>\n" +
    "\n" +
    "    <a class=p10 ng-click=\"topbar.goPreferences(); index.setCompactTxHistory()\">\n" +
    "      <i class=\"fi-widget size-24\"></i>\n" +
    "    </a>\n" +
    "  </section>\n" +
    "\n" +
    "  <section class=\"middle tab-bar-section\">\n" +
    "    <h1 class=\"title ellipsis\">\n" +
    "      {{(titleSection|translate) || (index.alias || index.walletName)}}\n" +
    "    </h1>\n" +
    "  </section>\n" +
    "</nav>\n"
  );


  $templateCache.put('views/includes/transaction.html',
    "<div class=\"row collapse last-transactions-content line-b\" ng-class=\"{'text-gray':!tx.pendingForUs}\" ng-click=\"home.openTxpModal(tx, index.copayers, !!index.glideraStatus)\">\n" +
    "  <div class=\"large-6 medium-6 small-6 columns size-14\">\n" +
    "    <div class=\"m10r left pr\">\n" +
    "      <i class=\"icon-circle-active size-10\" ng-show=tx.pendingForUs ng-style=\"{'color':index.backgroundColor}\"></i>\n" +
    "      <img src=img/icon-proposal.svg alt=sync width=40>\n" +
    "    </div>\n" +
    "    <div class=m10t>\n" +
    "      <div ng-show=!tx.merchant>\n" +
    "        <span ng-show=\"index.addressbook[tx.toAddress] && !tx.message\">\n" +
    "          {{index.addressbook[tx.toAddress]}}\n" +
    "        </span>\n" +
    "        <span class=ellipsis ng-show=\"!index.addressbook[tx.toAddress] && tx.message\">\n" +
    "          {{tx.message}}\n" +
    "        </span>\n" +
    "        <span ng-show=\"!index.addressbook[tx.toAddress] && !tx.message\" translate>\n" +
    "          Sending\n" +
    "        </span>\n" +
    "      </div>\n" +
    "      <div ng-show=tx.merchant>\n" +
    "        <span ng-show=tx.merchant.pr.ca><i class=fi-lock></i> {{tx.merchant.domain}}</span>\n" +
    "        <span ng-show=!tx.merchant.pr.ca><i class=fi-unlock></i> {{tx.merchant.domain}}</span>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <div class=\"large-5 medium-5 small-5 columns text-right\">\n" +
    "    <span class=size-16>\n" +
    "      - {{tx.amountStr}}\n" +
    "    </span>\n" +
    "    <div class=\"size-12 text-gray\">\n" +
    "      <time>{{ (tx.ts || tx.createdOn ) * 1000 | amTimeAgo}}</time>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <div class=\"large-1 medium-1 small-1 columns text-right m10t\">\n" +
    "    <i class=\"icon-arrow-right3 size-18\"></i>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('views/includes/version.html',
    "<span ng-controller=\"versionController as v\">\n" +
    "  <small>v{{v.version}}</small> \n" +
    "</span>\n" +
    "\n"
  );


  $templateCache.put('views/includes/walletInfo.html',
    "<span ng-show=index.isShared class=size-12><span translate>{{index.m}}-of-{{index.n}}</span></span>\n" +
    "<span ng-show=index.isSingleAddress class=size-12><span translate>Auditable</span></span>\n" +
    "<img style=\"height:0.6em; margin-right: 1px\" ng-show=\"index.network != 'livenet'\" src=img/icon-testnet-white.svg>\n" +
    "<img style=\"height:0.6em; margin-right: 1px\" ng-show=\"!index.canSign && !index.isPrivKeyExternal\" src=img/icon-read-only-white.svg>\n" +
    "\n" +
    "<img style=\"height:0.6em; margin-right: 1px\" ng-show=\"index.externalSource == 'trezor'\" src=img/icon-trezor-white.svg>\n" +
    "<img style=\"height:0.6em; margin-right: 1px\" ng-show=\"index.externalSource == 'ledger'\" src=img/icon-ledger-white.svg>\n" +
    "<span class=\"size-12 dib\" style=\"height:0.6em; margin-right: 1px\" ng-show=index.account>#{{index.account || 0}} </span>\n" +
    "\n" +
    "<img style=\"height:0.6em; margin-right: 1px\" ng-show=index.isPrivKeyEncrypted src=img/icon-lock-white.svg>\n" +
    "\n" +
    "\n" +
    "<img style=\"height:0.6em; margin-right: 1px\" ng-show=index.usingCustomBWS src=img/icon-bws-white.svg>\n" +
    "\n" +
    "<img style=height:0.6em class=\"animated flash infinite\" ng-show=\"index.loadingWallet ||\n" +
    "index.updatingTxHistory\" src=img/icon-sync-white.svg>\n"
  );


  $templateCache.put('views/join.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Join shared wallet'; goBackToState = 'add'; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<div class=\"content p20v\" ng-controller=\"joinController as join\">\n" +
    "  <form name=joinForm ng-submit=join.join(joinForm) novalidate>\n" +
    "    <div class=\"box-notification m20b\" ng-show=join.error>\n" +
    "      <span class=text-warning>\n" +
    "        {{join.error|translate}}\n" +
    "      </span>\n" +
    "    </div>\n" +
    "    <div class=row>\n" +
    "      <div class=\"large-12 columns\">\n" +
    "\n" +
    "        <div>\n" +
    "          <label><span translate>Your nickname</span>\n" +
    "            <div class=input>\n" +
    "              <input placeholder=\"{{'John'|translate}}\" class=form-control name=myName ng-model=myName ng-required=true>\n" +
    "            </div>\n" +
    "          </label>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row collapse\">\n" +
    "          <label for=secret class=left><span translate>Wallet Invitation</span>\n" +
    "            <small translate ng-show=joinForm.secret.$pristine>Required</small>\n" +
    "          </label>\n" +
    "          <span class=\"has-error right size-12\" ng-show=\"joinForm.secret.$invalid\n" +
    "            && !joinForm.secret.$pristine\">\n" +
    "            <span class=icon-input><i class=fi-x></i></span>\n" +
    "            <span translate>Wallet Invitation is not valid!</span>\n" +
    "          </span>\n" +
    "          <small class=\"icon-input right\" ng-show=\"joinForm.secret.$valid\n" +
    "            && !joinForm.secret.$pristine\"><i class=fi-check></i></small>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=input>\n" +
    "          <input id=secret placeholder=\"{{'Paste invitation here'|translate}}\" name=secret ng-model=secret wallet-secret required>\n" +
    "          <div class=qr-scanner-input>\n" +
    "            <qr-scanner on-scan=join.onQrCodeScanned(data)></qr-scanner>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"m10t oh\" ng-init=\"hideAdv=true\">\n" +
    "          <a class=\"button outline light-gray expand tiny p10i\" ng-click=\"hideAdv=!hideAdv\">\n" +
    "            <i class=\"fi-widget m3r\"></i>\n" +
    "            <span translate ng-hide=!hideAdv>Show advanced options</span>\n" +
    "            <span translate ng-hide=hideAdv>Hide advanced options</span>\n" +
    "            <i ng-if=hideAdv class=icon-arrow-down4></i>\n" +
    "            <i ng-if=!hideAdv class=icon-arrow-up4></i>\n" +
    "          </a>\n" +
    "        </div>\n" +
    "\n" +
    "        <div ng-hide=hideAdv class=row>\n" +
    "          <div class=\"large-12 columns\">\n" +
    "            <div>\n" +
    "              <label for=bws class=oh>\n" +
    "                <span>Wallet Service URL</span>\n" +
    "                <input id=bwsurl name=bwsurl ng-model=bwsurl>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "\n" +
    "            <div>\n" +
    "              <label><span translate>Wallet Key </span>\n" +
    "              <select class=m10t ng-model=seedSource ng-options=\"seed as seed.label for seed in join.seedOptions\" ng-change=join.setSeedSource()>\n" +
    "              </select>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-show=\"join.seedSourceId == 'trezor' || join.seedSourceId == 'ledger'\">\n" +
    "              <label class=oh><span translate>Account Number</span>\n" +
    "                <input type=number id=account ng-model=account ignore-mouse-wheel>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=box-notification ng-show=\"join.seedSourceId=='new' && createPassphrase\">\n" +
    "              <span class=\"text-warning size-14\">\n" +
    "                <i class=fi-alert></i>\n" +
    "                <span translate>\n" +
    "                WARNING: The password cannot be recovered. <b>Be sure to write it down</b>. The wallet can not be restored without the password.\n" +
    "                </span>\n" +
    "              </span>\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-show=\"join.seedSourceId=='new' \">\n" +
    "              <label for=createPassphrase><span translate>Add a Password</span>  <small translate>Add an optional password to secure the recovery phrase</small>\n" +
    "                <div class=input>\n" +
    "                  <input class=form-control autocapitalize=off name=createPassphrase ng-model=createPassphrase>\n" +
    "                </div>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-show=\"join.seedSourceId=='set'\">\n" +
    "              <label for=ext-master>\n" +
    "                <span translate>Wallet Recovery Phrase</span>\n" +
    "                <small translate>Enter the recovery phrase (BIP39)</small>\n" +
    "                <input id=ext-master autocapitalize=off name=privateKey ng-model=privateKey>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-show=\"join.seedSourceId=='set'\">\n" +
    "              <label for=passphrase> <span translate>Password</span>  <small translate>The recovery phrase could require a password to be imported</small>\n" +
    "                <div class=input>\n" +
    "                  <input autocapitalize=off class=form-control name=passphrase ng-model=passphrase>\n" +
    "                </div>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "            <div ng-show=\"join.seedSourceId == 'set'\">\n" +
    "              <label class=oh><span translate>Derivation Path</span> <small translate>BIP32 path for address derivation</small>\n" +
    "                <input class=form-control name=derivationPath ng-model=derivationPath>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "          </div> \n" +
    "        </div> \n" +
    "\n" +
    "        <button translate type=submit class=\"button expand black m0 round\" ng-disabled=joinForm.$invalid>Join</button>\n" +
    "      </div> \n" +
    "    </div> \n" +
    "  </form>\n" +
    "</div>\n" +
    "<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/modals/addressbook.html',
    "<ion-modal-view ng-controller=addressbookController>\n" +
    "  <div ng-init=\"wallets[0] ? setSelectedWalletsOpt(true) : etSelectedWalletsOpt(false); checkClipboard()\">\n" +
    "    <ion-header-bar align-title=center class=tab-bar ng-style=\"{'background-color':color}\">\n" +
    "      <div class=left-small>\n" +
    "        <a ng-show=\"!editAddressbook && !addAddressbookEntry\" ng-click=cancelAddress() class=p10>\n" +
    "          <span class=text-close translate>Close</span>\n" +
    "        </a>\n" +
    "      </div>\n" +
    "      <h1 class=\"title ellipsis\">{{walletName}}</h1>\n" +
    "      <div class=right-small ng-show=\"!selectedWalletsOpt && !isEmptyList\" ng-click=toggleEditAddressbook()>\n" +
    "        <a ng-show=\"!editAddressbook && !addAddressbookEntry\" href class=p10>\n" +
    "          <span class=text-close translate>Edit</span>\n" +
    "        </a>\n" +
    "        <a ng-show=\"editAddressbook && !addAddressbookEntry\" href class=p10>\n" +
    "          <span class=text-close translate>Done</span>\n" +
    "        </a>\n" +
    "      </div>\n" +
    "    </ion-header-bar>\n" +
    "\n" +
    "    <ion-content ng-style=\"{'background-color': '#f6f7f9'}\">\n" +
    "      <div class=\"modal-content p20b\">\n" +
    "        <div class=\"create-tab small-only-text-center\" ng-show=\"!editAddressbook && !addAddressbookEntry\">\n" +
    "          <div class=row>\n" +
    "            <div class=\"tab-container small-6 medium-6 large-6\" ng-class=\"{'selected':selectedWalletsOpt}\" ng-style=\"{'border-color':selectedWalletsOpt ? color : 'inherit'}\" ng-click=setSelectedWalletsOpt(true)>\n" +
    "              <a href ng-style=\"{'color':selectedWalletsOpt ? color : 'inherit'}\" translate> My wallets</a>\n" +
    "            </div>\n" +
    "            <div class=\"tab-container small-6 medium-6 large-6\" ng-class=\"{'selected':!selectedWalletsOpt}\" ng-style=\"{'border-color':!selectedWalletsOpt ? color : 'inherit'}\" ng-click=setSelectedWalletsOpt(false)>\n" +
    "              <a href ng-style=\"{'color':!selectedWalletsOpt ? color : 'inherit'}\" translate>My contacts</a>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "        <div ng-show=selectedWalletsOpt>\n" +
    "          <div class=onGoingProcess ng-if=gettingAddress>\n" +
    "            <div class=onGoingProcess-content ng-style=\"{'background-color':'#222'}\">\n" +
    "              <ion-spinner class=spinner-stable icon=lines></ion-spinner>\n" +
    "              <span translate> Getting address for wallet {{selectedWalletName}} ...</span>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "\n" +
    "          <div ng-if=!gettingAddress>\n" +
    "            <ul class=no-bullet>\n" +
    "              <li class=line-b ng-repeat=\"w in wallets\">\n" +
    "                <a ng-click=\"selectWallet(w.id, w.name)\" class=\"db oh\">\n" +
    "                  <div class=avatar-wallet ng-style=\"{'background-color':w.color}\">\n" +
    "                    <i class=\"icon-wallet size-21\"></i>\n" +
    "                  </div>\n" +
    "                  <div class=\"ellipsis name-wallet text-bold\">{{w.name || w.id}}\n" +
    "                    <span class=\"has-error right text-light size-12\" ng-show=errorSelectedWallet[w.id]>\n" +
    "                      <i class=\"icon-close-circle size-14\"></i>\n" +
    "                      <span class=vm>{{errorSelectedWallet[w.id] }}</span>\n" +
    "                    </span>\n" +
    "                  </div>\n" +
    "                  <div class=size-12>{{w.m}} of {{w.n}}\n" +
    "                    <span ng-show=\"w.network=='testnet'\">[Testnet]</span>\n" +
    "                  </div>\n" +
    "                </a>\n" +
    "              </li>\n" +
    "            </ul>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div ng-show=!selectedWalletsOpt class=m20b>\n" +
    "          <ul ng-show=!addAddressbookEntry class=\"no-bullet m0\" ng-init=contactList()>\n" +
    "            <li class=\"p10 line-b\" ng-repeat=\"(addr, label) in list\">\n" +
    "              <a ng-show=selectedAddressbook[addr] class=removeAddressbook ng-click=remove(addr) translate>Remove</a>\n" +
    "              <a ng-show=editAddressbook class=selectAddressbook ng-click=toggleSelectAddressbook(addr)>\n" +
    "              <i class=fi-trash></i></a>\n" +
    "              <div ng-click=selectAddressbook(addr)>\n" +
    "                <i class=\"icon-contact left size-42 m10r text-gray\"></i>\n" +
    "                <div>\n" +
    "                  <span>{{label}}</span>\n" +
    "                  <div class=\"size-12 text-gray ellipsis\">{{addr}}</div>\n" +
    "                </div>\n" +
    "              </div>\n" +
    "            </li>\n" +
    "            <li class=p10 ng-show=!editAddressbook>\n" +
    "              <a ng-click=toggleAddAddressbookEntry() class=p0i>\n" +
    "                <i class=\"fi-plus size-24 m20r lh icon\"></i>\n" +
    "                <span class=\"size-12 tu text-bold\" translate>Add a new entry</span>\n" +
    "              </a>\n" +
    "            </li>\n" +
    "          </ul>\n" +
    "\n" +
    "          <div ng-show=addAddressbookEntry>\n" +
    "            <h4 translate>Add a new entry</h4>\n" +
    "            <form name=addressbookForm class=p10 no-validate>\n" +
    "              <div class=\"text-warning size-12 m10b\" ng-show=error>{{error|translate}}</div>\n" +
    "              <span ng-hide=addressbookForm.address.$pristine>\n" +
    "                <span class=\"has-error right size-12\" ng-show=\"addressbookForm.address.$invalid && addressbook.address\">\n" +
    "                  <i class=\"icon-close-circle size-14\"></i>\n" +
    "                  <span class=vm translate>Not valid</span>\n" +
    "                </span>\n" +
    "                <small class=\"right text-primary\" ng-show=!addressbookForm.address.$invalid>\n" +
    "                  <i class=\"icon-checkmark-circle size-14\"></i>\n" +
    "                </small>\n" +
    "              </span>\n" +
    "\n" +
    "              <label translate>Address</label>\n" +
    "              <div class=input>\n" +
    "                <input id=address name=address ng-model=addressbook.address valid-address required>\n" +
    "                <div class=qr-scanner-input>\n" +
    "                  <qr-scanner on-scan=\"onQrCodeScanned(data, addressbookForm)\" before-scan=beforeQrCodeScann()></qr-scanner>\n" +
    "                </div>\n" +
    "              </div>\n" +
    "\n" +
    "              <label translate>Label</label>\n" +
    "              <input id=label name=label ng-model=addressbook.label required>\n" +
    "              <div class=row>\n" +
    "                <div class=\"columns large-6 medium-6 small-6\">\n" +
    "                  <input type=button class=\"button expand outline dark-gray round\" ng-click=toggleAddAddressbookEntry() value=\"{{'Cancel'|translate}}\">\n" +
    "                </div>\n" +
    "                <div class=\"columns large-6 medium-6 small-6\">\n" +
    "                  <input type=submit class=\"button expand round black\" ng-click=add(addressbook) value=\"{{'Save'|translate}}\" ng-disabled=!addressbookForm.$valid ng-style=\"{'background-color':color}\">\n" +
    "                </div>\n" +
    "              </div>\n" +
    "            </form>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </ion-content>\n" +
    "  </div>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('views/modals/addToken.html',
    "<ion-modal-view ng-controller=\"addTokenController as addCtrl\">\n" +
    "  <ion-header-bar align-title=center class=tab-bar>\n" +
    "    <div class=left-small>\n" +
    "      <a ng-click=close() class=p10>\n" +
    "        <span class=text-close translate>Close</span>\n" +
    "      </a>\n" +
    "    </div>\n" +
    "    <h1 class=\"title ellipsis\" translate>\n" +
    "      Add new token\n" +
    "    </h1>\n" +
    "  </ion-header-bar>\n" +
    "\n" +
    "  <ion-content>\n" +
    "\n" +
    "    <div class=modal-content>\n" +
    "      <form name=addTokenForm novalidate>\n" +
    "        <div class=\"box-notification m20b\" id=notification ng-show=addCtrl.error>\n" +
    "          <span class=text-warning>\n" +
    "            {{addCtrl.error|translate}}\n" +
    "          </span>\n" +
    "        </div>\n" +
    "        <div class=row>\n" +
    "          <div class=\"large-12 columns\">\n" +
    "            <h4></h4>\n" +
    "            <div>\n" +
    "              <label><span translate>Asset id</span>\n" +
    "                <div class=input>\n" +
    "                  <input placeholder=\"\" class=form-control ng-disabled=addCtrl.updating name=assetId ng-model=assetId ng-required=true ng-focus=\"addCtrl.formFocus('asset-id')\" ng-blur=addCtrl.formFocus(false)>\n" +
    "                </div>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "            <div>\n" +
    "              <label><span translate>Symbol</span> <small translate>Currency symbol, e.g. bR$</small>\n" +
    "                <div class=input>\n" +
    "                  <input placeholder=\"\" class=form-control ng-disabled=addCtrl.updating name=symbol ng-model=symbol ng-required=true ng-focus=\"addCtrl.formFocus('symbol')\" ng-blur=addCtrl.formFocus(false)>\n" +
    "                </div>\n" +
    "              </label>\n" +
    "            </div>\n" +
    "\n" +
    "            <button class=\"button round black expand\" ng-disabled=\"addTokenForm.$invalid || addCtrl.updating\" ng-click=addCtrl.addToken(addTokenForm)>\n" +
    "              <span translate>Add new token</span>\n" +
    "            </button>\n" +
    "\n" +
    "          </div> \n" +
    "        </div> \n" +
    "      </form>\n" +
    "    </div>\n" +
    "  </ion-content>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('views/modals/amazon-card-details.html',
    "<ion-modal-view ng-controller=amazonCardDetailsController>\n" +
    "  <ion-header-bar align-title=center class=tab-bar>\n" +
    "    <div class=left-small>\n" +
    "      <a ng-click=cancel() class=p10>\n" +
    "        <span class=text-close>Close</span>\n" +
    "      </a>\n" +
    "    </div>\n" +
    "    <h1 class=\"title ellipsis\">\n" +
    "      Details\n" +
    "    </h1>\n" +
    "  </ion-header-bar>\n" +
    "\n" +
    "  <ion-content>\n" +
    "\n" +
    "    <div class=modal-content>\n" +
    "      <div class=\"header-modal text-center\">\n" +
    "\n" +
    "        <img src=img/a_generic.jpg alt=\"Amazon.com Gift Card\" width=230 ng-click=refreshGiftCard()>\n" +
    "\n" +
    "        <div ng-show=card.claimCode>\n" +
    "          <div class=m10t>\n" +
    "            Gift Card Amount:\n" +
    "            <span class=text-bold>\n" +
    "              {{card.amount | currency : '$ ' : 2}}\n" +
    "            </span>\n" +
    "          </div>\n" +
    "          <div ng-show=\"card.cardStatus !== 'Canceled'\">\n" +
    "            Claim code: <span class=\"text-bold enable_text_select\">{{card.claimCode}}</span>\n" +
    "          </div>\n" +
    "          <div class=m10t ng-show=\"card.cardStatus == 'Fulfilled'\">\n" +
    "            <button class=\"button black round tiny\" ng-click=\"$root.openExternalLink('https://www.amazon.com/gc/redeem?claimCode=' + card.claimCode, '_system')\">\n" +
    "              Redeem Now\n" +
    "            </button>\n" +
    "          </div>\n" +
    "          <div class=m10t ng-show=\"card.cardStatus == 'Canceled'\">\n" +
    "            <div class=m10t>\n" +
    "              Status:\n" +
    "              <span class=text-bold>\n" +
    "                CANCELED\n" +
    "              </span>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "        <div ng-show=!card.claimCode>\n" +
    "          <div class=m10t>\n" +
    "            Status:\n" +
    "            <span class=text-bold ng-show=\"card.status == 'PENDING'\">\n" +
    "              PENDING\n" +
    "            </span>\n" +
    "            <span class=text-bold ng-show=\"card.status == 'FAILURE' || card.status == 'RESEND'\">\n" +
    "              FAILURE\n" +
    "            </span>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "        <div class=\"size-12 m10t text-center\">\n" +
    "          <a ng-click=$root.openExternalLink(card.invoiceUrl)>See invoice</a>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"box-notification m20b\" ng-show=error ng-click=\"error = null\">\n" +
    "        <span class=text-warning>\n" +
    "          {{error}}\n" +
    "        </span>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"text-center size-12 text-warning m10\" ng-show=\"card.status == 'FAILURE' || card.status == 'RESEND'\">\n" +
    "          There was a failure to the create gift card. Please, contact BitPay support.\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"oh m20t size-12 p15h\" ng-show=\"card.claimCode && card.cardStatus == 'Fulfilled'\">\n" +
    "        To redeem your gift card, follow these steps:\n" +
    "\n" +
    "        <ol class=\"m10t size-12\">\n" +
    "          <li>1. Visit <a ng-click=\"$root.openExternalLink('https://www.amazon.com/gc')\">www.amazon.com/gc</a>\n" +
    "          </li><li>2. Click Apply to Account and enter the Claim Code when prompted.\n" +
    "          </li><li>3. Gift card funds will be applied automatically to eligible orders during the checkout process.\n" +
    "          </li><li>4. You must pay for any remaining balance on your order with another payment method.\n" +
    "        </li></ol>\n" +
    "\n" +
    "        <p class=size-12>\n" +
    "        Your gift card claim code may also be entered when prompted during checkout. To redeem your gift card using\n" +
    "        the Amazon.com 1-Click&reg; service, first add the gift card funds to Your Account.\n" +
    "        </p>\n" +
    "\n" +
    "        <p class=size-12>\n" +
    "        If you have questions about redeeming your gift card, please visit\n" +
    "        <a ng-click=\"$root.openExternalLink('https://www.amazon.com/gc-redeem')\">www.amazon.com/gc-redeem</a>.\n" +
    "        If you have questions regarding the BitPay Introductory offer, please contact BitPay.\n" +
    "        </p>\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"size-12 white p15 m30v\">\n" +
    "        * <a ng-click=\"$root.openExternalLink('http://amazon.com')\">Amazon.com</a> is not a sponsor of this promotion.\n" +
    "        Except as required by law, <a ng-click=\"$root.openExternalLink('http://amazon.com')\">Amazon.com</a>\n" +
    "        Gift Cards (\"GCs\") cannot be transferred for value or redeemed for cash. GCs may be used only for purchases of\n" +
    "        eligible goods at <a ng-click=\"$root.openExternalLink('http://amazon.com')\">Amazon.com</a> or certain of its\n" +
    "        affiliated websites. For complete terms and conditions, see\n" +
    "        <a ng-click=\"$root.openExternalLink('https://www.amazon.com/gc-legal')\">www.amazon.com/gc-legal</a>.\n" +
    "        GCs are issued by ACI Gift Cards, Inc., a Washington corporation. All Amazon &reg;, &trade; &amp; &copy; are IP\n" +
    "        of <a ng-click=\"$root.openExternalLink('http://amazon.com')\">Amazon.com</a>, Inc. or its affiliates.\n" +
    "        No expiration date or service fees.\n" +
    "      </div>\n" +
    "\n" +
    "      <ul class=\"no-bullet size-14 m30v text-center\">\n" +
    "        <li class=\"line-b p10 oh pointer\" ng-show=\"card.status == 'SUCCESS' && card.cardStatus == 'Fulfilled'\" ng-click=cancelGiftCard()>\n" +
    "          <span class=text-warning>Cancel</span>\n" +
    "        </li>\n" +
    "        <li class=\"line-b p10 oh pointer\" ng-show=\"card.status == 'FAILURE' || card.cardStatus == 'Canceled'\n" +
    "          || card.cardStatus == 'Expired'\" ng-click=remove()>\n" +
    "          <span class=text-warning>Remove</span>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "\n" +
    "      <div class=extra-margin-bottom></div>\n" +
    "    </div>\n" +
    "  </ion-content>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('views/modals/coinbase-confirmation.html',
    "<ion-modal-view ng-controller=coinbaseConfirmationController>\n" +
    "  <div class=\"m20tp text-center\">\n" +
    "    <div class=row>\n" +
    "    <h1 class=\"text-center m20b p20h\">Are you sure you would like to log out of your Coinbase account?</h1>\n" +
    "    <p class=\"text-gray p20h\">You will need to log back in to buy or sell bitcoin in Copay.</p>\n" +
    "    <div class=\"large-6 medium-6 small-6 columns\">\n" +
    "      <button class=\"button light-gray expand outline round\" ng-click=cancel()>\n" +
    "        <i class=fi-arrow-left></i> <span class=tu>Back</span>\n" +
    "      </button>\n" +
    "    </div>\n" +
    "    <div class=\"large-6 medium-6 small-6 columns\">\n" +
    "      <button class=\"button warning expand round\" ng-click=ok()>\n" +
    "        <span>Log out</span>\n" +
    "      </button>\n" +
    "    </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('views/modals/coinbase-tx-details.html',
    "<ion-modal-view ng-controller=coinbaseTxDetailsController>\n" +
    "  <ion-header-bar align-title=center class=tab-bar ng-style=\"{'background-color': '#2b71b1'}\">\n" +
    "    <div class=left-small>\n" +
    "      <a ng-click=cancel()>\n" +
    "        <i class=\"icon-arrow-left3 icon-back\"></i>\n" +
    "        <span class=text-back>Back</span>\n" +
    "      </a>\n" +
    "    </div>\n" +
    "    <h1 class=\"title ellipsis\" translate>Details</h1>\n" +
    "  </ion-header-bar>\n" +
    "\n" +
    "  <ion-content>\n" +
    "    <div class=\"modal-content fix-modals-touch\">\n" +
    "      <div class=\"header-modal bg-gray text-center\">\n" +
    "        <div class=p20>\n" +
    "          <img src=img/bought.svg alt=bought width=65 ng-show=\"(tx.type == 'buy' || (tx.type == 'send' && tx.to)) && tx.status == 'completed'\">\n" +
    "          <img src=img/bought-pending.svg alt=bought width=65 ng-show=\"(tx.type == 'buy' || (tx.type == 'send' && tx.to)) && tx.status != 'completed'\">\n" +
    "          <img src=img/sold.svg alt=bought width=65 ng-show=\"tx.type == 'sell' && tx.status == 'completed'\">\n" +
    "          <img src=img/sold-pending.svg alt=bought width=65 ng-show=\"(tx.type == 'sell' || (tx.type == 'send' && tx.from)) && tx.status != 'completed'\">\n" +
    "        </div>\n" +
    "        <div ng-show=\"tx.status == 'completed'\">\n" +
    "          <span ng-show=\"tx.type == 'buy' || tx.type == 'send'\">Bought</span>\n" +
    "          <span ng-show=\"tx.type == 'sell'\">Sold</span>\n" +
    "        </div>\n" +
    "        <div ng-show=\"tx.type == 'send' && (tx.to || tx.from) && tx.status != 'completed'\">\n" +
    "          <span ng-show=tx.to>Receiving purchased bitcoin</span>\n" +
    "          <span ng-show=tx.from>Sending bitcoin to sell</span>\n" +
    "        </div>\n" +
    "        <div ng-show=\"(tx.type == 'sell' || tx.type == 'buy') && tx.status != 'completed'\">\n" +
    "          <span ng-show=\"tx.type == 'buy'\">Buying bitcoin</span>\n" +
    "          <span ng-show=\"tx.type == 'sell'\">Selling bitcoin</span>\n" +
    "        </div>\n" +
    "        <div class=\"size-24 text-bold\">\n" +
    "          <span ng-if=\"tx.type == 'sell' || (tx.type == 'send' && tx.from)\">-</span>{{tx.amount.amount.replace('-','')}}\n" +
    "          {{tx.amount.currency}}\n" +
    "        </div>\n" +
    "        <div class=\"label gray radius m10b\">\n" +
    "          <span ng-if=\"tx.type == 'sell' || (tx.type == 'send' && tx.from)\">-</span>{{tx.native_amount.amount.replace('-','')}}\n" +
    "          {{tx.native_amount.currency}}\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "      <div class=\"m20b box-notification\" ng-show=tx.error>\n" +
    "        <ul class=\"no-bullet m0 text-warning size-12\">\n" +
    "          <li ng-repeat=\"err in tx.error.errors\" ng-bind-html=err.message></li>\n" +
    "        </ul>\n" +
    "      </div>\n" +
    "\n" +
    "      <ul class=\"no-bullet size-14\">\n" +
    "\n" +
    "        <li ng-show=\"tx.details && tx.status != 'pending'\" class=\"line-b p10 oh\">\n" +
    "          <span class=text-gray>{{tx.details.title}}</span>\n" +
    "          <span class=right>{{tx.details.subtitle}}</span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li class=\"line-b p10 oh\">\n" +
    "          <span class=text-gray>Status</span>\n" +
    "          <span class=\"text-success right\" ng-if=\"tx.status == 'completed'\">Completed</span>\n" +
    "          <span class=\"text-info right\" ng-if=\"tx.status == 'pending'\">Pending</span>\n" +
    "          <span class=\"text-warning right\" ng-if=\"tx.status == 'error'\">Error</span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li ng-show=tx.created_at class=\"line-b p10 oh\">\n" +
    "          <span class=text-gray>Date</span>\n" +
    "          <span class=right>{{tx.created_at | amCalendar}}</span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li ng-show=tx.price_sensitivity class=\"line-b p10 oh\">\n" +
    "          <span class=text-gray>Price Sensitivity</span>\n" +
    "          <span class=right>{{tx.price_sensitivity.name}}</span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li ng-show=tx.sell_price_amount class=\"line-b p10 oh\">\n" +
    "          <span class=text-gray>Sell Price</span>\n" +
    "          <span class=right>{{tx.sell_price_amount}} {{tx.sell_price_currency}}</span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li ng-show=tx.description class=\"line-b p10 oh\">\n" +
    "          <span class=text-gray ng-show=\"tx.from && tx.type == 'send'\">Sent bitcoin from</span>\n" +
    "          <span class=text-gray ng-show=\"tx.to && tx.type == 'send'\">Receive bitcoin in</span>\n" +
    "          <span class=\"right text-bold\">{{tx.description}}</span>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "\n" +
    "      <div class=\"row m20t\" ng-show=\"tx.status == 'error'\">\n" +
    "        <div class=columns>\n" +
    "          <p class=\"text-center size-12 text-gray\">\n" +
    "            This action will remove the transaction.\n" +
    "          </p>\n" +
    "          <button class=\"button outline round dark-gray expand tiny\" ng-click=remove()>\n" +
    "            <i class=fi-x></i>\n" +
    "            Remove\n" +
    "          </button>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=extra-margin-bottom></div>\n" +
    "    </div>\n" +
    "  </ion-content>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('views/modals/confirmation.html',
    "<ion-modal-view ng-controller=confirmationController>\n" +
    "  <div class=\"m20tp text-center\">\n" +
    "    <div class=row>\n" +
    "    <h1 class=\"text-center m20b p20\">{{title|translate}}</h1>\n" +
    "      <div class=\"large-6 medium-6 small-6 columns\">\n" +
    "        <button class=\"button warning expand round\" ng-disabled=loading ng-click=ok()>\n" +
    "          <i class=fi-trash></i> <span translate>Yes</span>\n" +
    "        </button>\n" +
    "      </div>\n" +
    "      <div class=\"large-6 medium-6 small-6 columns\">\n" +
    "        <button class=\"button light-gray expand outline round\" ng-disabled=loading ng-click=cancel()>\n" +
    "          <i class=fi-x></i> <span class=tu translate>Cancel</span>\n" +
    "        </button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('views/modals/customAmount.html',
    "<ion-modal-view ng-controller=customAmountController>\n" +
    "  <ion-header-bar align-title=center class=tab-bar ng-style=\"{'background-color':color}\">\n" +
    "    <div class=left-small>\n" +
    "      <a ng-click=cancel() class=p10>\n" +
    "        <span class=text-close translate>Close</span>\n" +
    "      </a>\n" +
    "    </div>\n" +
    "    <h1 class=\"title ellipsis\" translate>Request a specific amount</h1>\n" +
    "  </ion-header-bar>\n" +
    "\n" +
    "  <ion-content ng-style=\"{'background-color': '#f6f7f9'}\">\n" +
    "    <div class=\"modal-content fix-modals-touch\">\n" +
    "      <div class=m20b ng-show=customizedAmountBtc>\n" +
    "        <h4 class=\"title m0\" translate>QR Code</h4>\n" +
    "        <ul class=\"no-bullet size-14 m0\">\n" +
    "          <li class=\"line-b p10 oh text-center\">\n" +
    "            <qrcode size=220 data=\"bitcoin:{{addr + '?amount=' + customizedAmountBtc}}\"></qrcode>\n" +
    "            <div class=\"m10t text-center\" ng-show=isCordova>\n" +
    "              <span class=\"button outline dark-gray tiny round\" ng-click=\"shareAddress('bitcoin:' + addr + '?amount=' + customizedAmountBtc)\">\n" +
    "                <i class=fi-share></i>\n" +
    "                <span translate>Share address</span>\n" +
    "              </span>\n" +
    "            </div>\n" +
    "          </li>\n" +
    "        </ul>\n" +
    "\n" +
    "        <h4 class=\"title m0\" translate>Details</h4>\n" +
    "        <ul class=\"no-bullet size-14 m0\">\n" +
    "          <li class=\"line-b p10 oh\">\n" +
    "            <span class=text-gray translate>Address</span>:\n" +
    "            <span class=right>\n" +
    "              <span class=\"text-gray enable_text_select\">{{addr}}</span>\n" +
    "            </span>\n" +
    "          </li>\n" +
    "          <li class=\"line-b p10 oh\">\n" +
    "            <span class=text-gray translate>Amount</span>:\n" +
    "            <span class=right>\n" +
    "              {{customizedAmountUnit}}\n" +
    "              <span class=\"label gray radius\">{{customizedAlternativeUnit}}</span>\n" +
    "            </span>\n" +
    "          </li>\n" +
    "        </ul>\n" +
    "      </div>\n" +
    "\n" +
    "      <div ng-show=!customizedAmountBtc class=\"row m20t\">\n" +
    "        <div class=\"large-12 large-centered columns\">\n" +
    "          <form name=amountForm ng-submit=submitForm(amountForm) novalidate>\n" +
    "            <div class=right ng-hide=\"amountForm.amount.$pristine && !amountForm.amount.$modelValue \">\n" +
    "              <span class=\"has-error right size-12\" ng-if=amountForm.amount.$invalid>\n" +
    "                <i class=\"icon-close-circle size-14\"></i>\n" +
    "                <span clas=vm translate>Not valid</span>\n" +
    "              </span>\n" +
    "              <small class=\"text-primary right\" ng-if=!amountForm.amount.$invalid>\n" +
    "                <i class=\"icon-checkmark-circle size-14\"></i>\n" +
    "              </small>\n" +
    "            </div>\n" +
    "            <div ng-show=!showAlternative>\n" +
    "              <label for=amount>\n" +
    "                <span translate>Amount</span>\n" +
    "              </label>\n" +
    "              <div class=input>\n" +
    "                <input type=number id=amount name=amount ng-attr-placeholder=\"{{'Amount in'|translate}} {{unitName}}\" ignore-mouse-wheel ng-model=_customAmount ng-minlength=0.00000001 ng-maxlength=10000000000 valid-amount required autocomplete=off>\n" +
    "                <input type=number id=alternative name=alternative ng-model=_customAlternative style=display:none>\n" +
    "                <a class=\"postfix button\" ng-style=\"{'background-color':color}\" ng-click=toggleAlternative()>{{unitName}}</a>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "            <div ng-show=showAlternative>\n" +
    "              <label for=alternative><span translate>Amount</span> [{{ alternativeIsoCode }}]\n" +
    "              </label>\n" +
    "              <div class=input>\n" +
    "                <input type=number id=alternative name=alternative ng-attr-placeholder=\"{{'Amount in'|translate}} {{alternativeName}}\" ignore-mouse-wheel ng-model=_customAlternative required autocomplete=off required>\n" +
    "                <input type=number id=amount name=amount ng-model=_customAmount style=display:none>\n" +
    "                <a class=\"postfix button black\" ng-click=toggleAlternative()> {{ alternativeIsoCode }}</a>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <button type=submit class=\"button black round expand\" ng-disabled=amountForm.$invalid ng-style=\"{'background-color':color}\" translate>\n" +
    "              Generate QR Code\n" +
    "            </button>\n" +
    "          </form>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </ion-content>\n" +
    "\n" +
    "</ion-modal-view>"
  );


  $templateCache.put('views/modals/glidera-confirmation.html',
    "<ion-modal-view ng-controller=glideraConfirmationController>\n" +
    "  <div class=\"m20tp text-center\">\n" +
    "    <div class=row>\n" +
    "    <h1 class=\"text-center m20b p20h\">Are you sure you would like to log out of your Glidera account?</h1>\n" +
    "    <p class=\"text-gray p20h\">You will need to log back in to buy or sell bitcoin in Copay.</p>\n" +
    "    <div class=\"large-6 medium-6 small-6 columns\">\n" +
    "      <button class=\"button light-gray expand outline round\" ng-click=cancel()>\n" +
    "        <i class=fi-arrow-left></i> <span class=tu>Back</span>\n" +
    "      </button>\n" +
    "    </div>\n" +
    "    <div class=\"large-6 medium-6 small-6 columns\">\n" +
    "      <button class=\"button warning expand round\" ng-click=ok()>\n" +
    "        <span>Log out</span>\n" +
    "      </button>\n" +
    "    </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('views/modals/glidera-tx-details.html',
    "<ion-modal-view ng-controller=glideraTxDetailsController>\n" +
    "  <ion-header-bar align-title=center class=tab-bar>\n" +
    "    <div class=left-small>\n" +
    "      <a ng-click=cancel()>\n" +
    "        <i class=\"icon-arrow-left3 icon-back\"></i>\n" +
    "        <span class=text-back>Back</span>\n" +
    "      </a>\n" +
    "    </div>\n" +
    "    <h1 class=\"title ellipsis\" translate>Details</h1>\n" +
    "  </ion-header-bar>\n" +
    "\n" +
    "  <ion-content>\n" +
    "    <div class=\"modal-content fix-modals-touch\">\n" +
    "      <div class=\"header-modal bg-gray text-center\">\n" +
    "        <div class=p20>\n" +
    "          <img src=img/bought.svg alt=bought width=80 ng-show=\"tx.type == 'BUY' && tx.status == 'COMPLETE'\">\n" +
    "          <img src=img/bought-pending.svg alt=bought width=65 ng-show=\"tx.type == 'BUY' && tx.status == 'PROCESSING'\">\n" +
    "          <img src=img/sold.svg alt=bought width=80 ng-show=\"tx.type == 'SELL' && tx.status == 'COMPLETE'\">\n" +
    "          <img src=img/sold-pending.svg alt=bought width=65 ng-show=\"tx.type == 'SELL' && tx.status == 'PROCESSING'\">\n" +
    "        </div>\n" +
    "        <span ng-show=\"tx.type == 'BUY'\">Bought</span>\n" +
    "        <span ng-show=\"tx.type == 'SELL'\">Sold</span>\n" +
    "        <b>{{tx.qty}}</b> BTC\n" +
    "        <div class=\"size-36 m20b\">\n" +
    "          {{tx.subtotal|currency:'':2}} {{tx.currency}}\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <ul class=\"no-bullet size-14\">\n" +
    "\n" +
    "        <li class=\"line-b p10 oh\">\n" +
    "          <span class=text-gray>Status</span>\n" +
    "          <span class=\"text-success right\" ng-if=\"tx.status == 'COMPLETE'\">Completed</span>\n" +
    "          <span class=\"text-info right\" ng-if=\"tx.status == 'PROCESSING'\">Processing</span>\n" +
    "          <span class=\"text-warning right\" ng-if=\"tx.status == 'ERROR'\">Error</span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li ng-show=tx.transactionDate class=\"line-b p10 oh\">\n" +
    "          <span class=text-gray>Date</span>\n" +
    "          <span class=right>{{tx.transactionDate | amCalendar}}</span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li ng-show=tx.price class=\"line-b p10 oh\">\n" +
    "          <span class=text-gray>Exchange rate</span>\n" +
    "          <span class=right>{{tx.price|currency:'':2}} {{tx.currency}}/BTC</span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li ng-show=tx.subtotal class=\"line-b p10 oh\">\n" +
    "          <span class=text-gray>Subtotal</span>\n" +
    "          <span class=right>{{tx.subtotal|currency:'':2}} {{tx.currency}}</span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li ng-show=tx.fees class=\"line-b p10 oh\">\n" +
    "          <span class=text-gray>Fees</span>\n" +
    "          <span class=right>{{tx.fees|currency:'':2}} {{tx.currency}}</span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li ng-show=tx.total class=\"line-b p10 oh text-bold\">\n" +
    "          <span class=text-gray>Total</span>\n" +
    "          <span class=right>{{tx.total|currency:'':2}} {{tx.currency}}</span>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "      <div class=extra-margin-bottom></div>\n" +
    "    </div>\n" +
    "  </ion-content>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('views/modals/inputAmount.html',
    "<ion-modal-view ng-controller=inputAmountController ng-style=\"{'background-color':'#F6F7F9'}\" ng-init=init()>\n" +
    "  <ion-header-bar align-title=center class=tab-bar ng-style=\"{'background-color':color}\">\n" +
    "    <div class=left-small>\n" +
    "      <a ng-click=cancel() class=p10>\n" +
    "        <span class=text-close translate>Close</span>\n" +
    "      </a>\n" +
    "    </div>\n" +
    "    <h1 class=\"title ellipsis\" translate>Enter amount</h1>\n" +
    "    <div class=\"buttons m5r m3t\" ng-if=!specificAmount ng-click=toggleAlternative()>\n" +
    "      <button class=\"button black\" ng-show=showAlternativeAmount>{{alternativeIsoCode}}</button>\n" +
    "      <button class=button ng-style=\"{'background-color':color}\" ng-show=!showAlternativeAmount>{{unitName}}</button>\n" +
    "    </div>\n" +
    "    <div class=\"right-small m10r\" ng-if=specificAmount>\n" +
    "      <a ng-click=init()>\n" +
    "        <span class=text-close translate>Cancel</span>\n" +
    "      </a>\n" +
    "    </div>\n" +
    "  </ion-header-bar>\n" +
    "\n" +
    "  <ion-pane>\n" +
    "    <ion-content class=calculator scroll=false ng-show=!specificAmount>\n" +
    "      <div class=header-calc>\n" +
    "        <div class=\"text-light text-black\" ng-class=\"{'size-28': smallFont, 'size-36': !smallFont}\">{{amount || '-'}}</div>\n" +
    "        <div class=\"text-light text-black\" ng-class=\"{'size-16': smallFont, 'size-17': !smallFont}\" ng-show=!showAlternativeAmount>\n" +
    "          {{globalResult}} <span class=\"label gray radius\">{{amountResult || '0.00'}} {{alternativeIsoCode}}</span>\n" +
    "        </div>\n" +
    "        <div class=\"text-light text-black size-17\" ng-show=showAlternativeAmount>\n" +
    "          {{globalResult}} <span class=\"label gray radius\">{{alternativeResult || '0.00'}} {{unitName}}</span>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=button-calc>\n" +
    "        <div class=oh>\n" +
    "          <div class=\"left large-3 medium-3 small-3\">\n" +
    "            <button class=\"button expand text-center m0 operator\" ng-click=resetAmount()>\n" +
    "              AC\n" +
    "            </button>\n" +
    "          </div>\n" +
    "          <div class=\"left large-9 medium-9 small-9\">\n" +
    "            <button class=\"button expand text-center m0\" ng-style=\"{'background-color':index.backgroundColor}\" ng-disabled=\"alternativeResult <= 0 && amountResult <= 0\" ng-click=finish() ng-show=!specificAmount>\n" +
    "              OK\n" +
    "            </button>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "        <div class=\"row collapse\">\n" +
    "          <div class=\"columns large-3 medium-3 small-3\" ng-click=\"pushDigit('7')\">7</div>\n" +
    "          <div class=\"columns large-3 medium-3 small-3\" ng-click=\"pushDigit('8')\">8</div>\n" +
    "          <div class=\"columns large-3 medium-3 small-3\" ng-click=\"pushDigit('9')\">9</div>\n" +
    "          <div class=\"columns large-3 medium-3 small-3 operator\" ng-click=\"pushOperator('/')\">/</div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row collapse\">\n" +
    "          <div class=\"columns large-3 medium-3 small-3\" ng-click=\"pushDigit('4')\">4</div>\n" +
    "          <div class=\"columns large-3 medium-3 small-3\" ng-click=\"pushDigit('5')\">5</div>\n" +
    "          <div class=\"columns large-3 medium-3 small-3\" ng-click=\"pushDigit('6')\">6</div>\n" +
    "          <div class=\"columns large-3 medium-3 small-3 operator\" ng-click=\"pushOperator('x')\">x</div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row collapse\">\n" +
    "          <div class=\"columns large-3 medium-3 small-3\" ng-click=\"pushDigit('1')\">1</div>\n" +
    "          <div class=\"columns large-3 medium-3 small-3\" ng-click=\"pushDigit('2')\">2</div>\n" +
    "          <div class=\"columns large-3 medium-3 small-3\" ng-click=\"pushDigit('3')\">3</div>\n" +
    "          <div class=\"columns large-3 medium-3 small-3 operator\" ng-click=\"pushOperator('+')\">+</div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row collapse\">\n" +
    "          <div class=\"columns large-3 medium-3 small-3 operator\" ng-click=\"pushDigit('.')\">.</div>\n" +
    "          <div class=\"columns large-3 medium-3 small-3\" ng-click=\"pushDigit('0')\">0</div>\n" +
    "          <div class=\"columns large-3 medium-3 small-3 operator icon ion-arrow-left-a\" ng-click=removeDigit()></div>\n" +
    "          <div class=\"columns large-3 medium-3 small-3 operator\" ng-click=\"pushOperator('-')\">-</div>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </ion-content>\n" +
    "\n" +
    "    <ion-content ng-show=specificAmount ng-style=\"{'background-color':'#f6f7f9'}\">\n" +
    "      <section class=\"modal-content m20b\">\n" +
    "        <h4 class=\"title m10l\" translate>QR Code</h4>\n" +
    "        <ul class=\"no-bullet size-14 m0\">\n" +
    "          <li class=\"line-b p10 oh text-center\">\n" +
    "            <qrcode size=220 data=\"bitcoin:{{addr + '?amount=' + customizedAmountBtc}}\"></qrcode>\n" +
    "            <div class=\"m10t text-center\" ng-show=isCordova>\n" +
    "              <span class=\"button outline dark-gray tiny round\" ng-click=\"shareAddress('bitcoin:' + addr + '?amount=' + customizedAmountBtc)\">\n" +
    "                <i class=fi-share></i>\n" +
    "                <span translate>Share address</span>\n" +
    "              </span>\n" +
    "            </div>\n" +
    "          </li>\n" +
    "        </ul>\n" +
    "\n" +
    "        <h4 class=\"title m10l\" translate>Details</h4>\n" +
    "        <ul class=\"no-bullet size-14 m0\">\n" +
    "          <li class=\"line-b p10 oh\">\n" +
    "            <span class=text-gray translate>Address</span>:\n" +
    "            <span class=right>\n" +
    "              <span class=\"text-gray enable_text_select\">{{addr}}</span>\n" +
    "            </span>\n" +
    "          </li>\n" +
    "          <li class=\"line-b p10 oh\">\n" +
    "            <span class=text-gray translate>Amount</span>:\n" +
    "            <span class=right>\n" +
    "              {{specificAmount}} {{unitName}}\n" +
    "              <span class=\"label gray radius\">{{specificAlternativeAmount}} {{alternativeIsoCode}}</span>\n" +
    "            </span>\n" +
    "          </li>\n" +
    "        </ul>\n" +
    "        <div class=extra-margin-bottom></div>\n" +
    "      </section>\n" +
    "    </ion-content>\n" +
    "  </ion-pane>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('views/modals/paypro.html',
    "<ion-modal-view ng-controller=\"payproController as payproC\">\n" +
    "  <ion-header-bar align-title=center class=tab-bar ng-style=\"{'background-color':color}\">\n" +
    "    <div class=left-small>\n" +
    "      <a ng-click=cancel() class=p10>\n" +
    "        <span class=text-close translate>Close</span>\n" +
    "      </a>\n" +
    "    </div>\n" +
    "    <h1 class=\"title ellipsis\" translate>Payment request</h1>\n" +
    "  </ion-header-bar>\n" +
    "\n" +
    "  <ion-content ng-style=\"{'background-color': '#F6F7F9'}\">\n" +
    "    <div class=modal-content>\n" +
    "      <div class=\"header-modal text-center p50t\">\n" +
    "        <div class=size-42>\n" +
    "          {{unitTotal}}  {{unitName}}\n" +
    "        </div>\n" +
    "        <div class=\"size-18 m5t text-gray\" ng-show=alternative>\n" +
    "          {{ alternative }} {{ alternativeIsoCode }}\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <h4 class=\"title m10l\" translate>Details</h4>\n" +
    "      <ul class=\"no-bullet size-14 m10t\">\n" +
    "        <li class=\"line-b p10 oh\">\n" +
    "        <span class=text-gray translate>Pay To</span>\n" +
    "        <span class=\"right enable_text_select\">{{paypro.domain}}</span>\n" +
    "        </li>\n" +
    "        <li class=\"line-b p10 oh\" ng-if=paypro.toAddress>\n" +
    "        <span class=text-gray translate>Address</span>\n" +
    "        <span class=\"right enable_text_select\">{{paypro.toAddress}}</span>\n" +
    "        </li>\n" +
    "        <li class=\"line-b p10 oh\">\n" +
    "        <span class=text-gray translate>Certified by</span>\n" +
    "        <span class=\"right text-right\">\n" +
    "          <span ng-show=paypro.caTrusted>\n" +
    "            <i class=\"fi-lock color-greeni\"></i>\n" +
    "            {{paypro.caName}}<br>\n" +
    "            <span translate>(Trusted)</span>\n" +
    "          </span>\n" +
    "          <span ng-show=!paypro.caTrusted>\n" +
    "            <span ng-show=paypro.selfSigned>\n" +
    "              <i class=\"fi-unlock color-yellowi\"></i> <span translate>Self-signed Certificate</span>\n" +
    "            </span>\n" +
    "            <span ng-show=!paypro.selfSigned>\n" +
    "              <i class=\"fi-unlock color-yellowi\"></i>{{paypro.caName}}<br>\n" +
    "              <span translate>WARNING: UNTRUSTED CERTIFICATE</span>\n" +
    "            </span>\n" +
    "          </span>\n" +
    "        </span>\n" +
    "        </li>\n" +
    "        <li class=\"line-b p10 oh\" ng-if=paypro.memo>\n" +
    "        <span class=text-gray translate>Memo</span>\n" +
    "        <span class=right>{{paypro.memo}}</span>\n" +
    "        </li>\n" +
    "        <li class=\"line-b p10 oh\" ng-if=paypro.expires>\n" +
    "        <span class=text-gray translate>Expires</span>\n" +
    "        <span class=right>{{paypro.expires * 1000 | amTimeAgo }}</span>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "    <div class=extra-margin-bottom></div>\n" +
    "  </ion-content>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('views/modals/scanner.html',
    "<ion-modal-view ng-controller=scannerController>\n" +
    "  <ion-header-bar align-title=center class=tab-bar>\n" +
    "    <div class=left-small>\n" +
    "      <a ng-click=cancel() class=p10>\n" +
    "        <span class=text-close translate>Close</span>\n" +
    "      </a>\n" +
    "    </div>\n" +
    "    <h1 class=\"title ellipsis\" translate>QR-Scanner</h1>\n" +
    "  </ion-header-bar>\n" +
    "  <ion-content class=\"modal-content text-center fix-modals-touch\" ng-init=init()>\n" +
    "    <canvas id=qr-canvas width=200 height=150></canvas>\n" +
    "    <video id=qrcode-scanner-video width=300 height=225></video>\n" +
    "  </ion-content>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('views/modals/search.html',
    "<ion-modal-view ng-controller=searchController>\n" +
    "  <ion-header-bar align-title=center class=tab-bar ng-style=\"{'background-color':color}\">\n" +
    "    <div class=left-small>\n" +
    "      <a ng-click=\"cancel(); index.cancelSearch()\" class=p10>\n" +
    "        <span class=text-close translate>Close</span>\n" +
    "      </a>\n" +
    "    </div>\n" +
    "    <h1 class=\"title ellipsis\" translate>Search Transactions</h1>\n" +
    "  </ion-header-bar>\n" +
    "\n" +
    "  <ion-content>\n" +
    "    <div class=\"row searchBar searchLabel\">\n" +
    "      <i class=\"fi-magnifying-glass size-14\"></i>\n" +
    "      <form>\n" +
    "        <input name=search type=search ng-model=search ng-init=\"search = ''\" ng-change=index.updateSearchInput(search) placeholder=\"{{'Search transactions' | translate}}\">\n" +
    "        \n" +
    "      </form>\n" +
    "    </div>\n" +
    "\n" +
    "    <div ng-repeat=\"btx in index.txHistorySearchResults track by btx.txid\" ng-click=home.openTxModal(btx) class=\"row collapse last-transactions-content\">\n" +
    "      <div class=\"large-6 medium-6 small-6 columns size-14\">\n" +
    "        <div class=\"m10r left\">\n" +
    "          <img src=img/icon-receive-history.svg alt=sync width=40 ng-show=\"btx.action == 'received'\">\n" +
    "          <img src=img/icon-sent-history.svg alt=sync width=40 ng-show=\"btx.action == 'sent'\">\n" +
    "          <img src=img/icon-moved.svg alt=sync width=40 ng-show=\"btx.action == 'moved'\">\n" +
    "        </div>\n" +
    "        <div class=m10t>\n" +
    "          <span ng-show=\"btx.action == 'received'\">\n" +
    "            <span class=ellipsis>\n" +
    "              <span ng-if=btx.note.body>{{btx.note.body}}</span>\n" +
    "              <span ng-if=!btx.note.body translate> Received</span>\n" +
    "            </span>\n" +
    "          </span>\n" +
    "          <span ng-show=\"btx.action == 'sent'\">\n" +
    "            <span class=ellipsis>\n" +
    "              <span ng-if=btx.message>{{btx.message}}</span>\n" +
    "              <span ng-if=\"!btx.message && btx.note.body\">{{btx.note.body}}</span>\n" +
    "              <span ng-if=\"!btx.message && !btx.note.body && index.addressbook[btx.addressTo]\">{{index.addressbook[btx.addressTo]}}</span>\n" +
    "              <span ng-if=\"!btx.message && !btx.note.body && !index.addressbook[btx.addressTo]\" translate> Sent</span>\n" +
    "            </span>\n" +
    "          </span>\n" +
    "          <span ng-show=\"btx.action == 'moved'\" translate>Moved</span>\n" +
    "          <span class=\"label tu warning radius\" ng-show=\"btx.action == 'invalid'\" translate>Invalid</span>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"large-5 medium-5 small-5 columns text-right\">\n" +
    "        <span class=size-16 ng-class=\"{'text-bold': btx.recent}\">\n" +
    "          <span ng-if=\"btx.action == 'received'\">+</span>\n" +
    "          <span ng-if=\"btx.action == 'sent'\">-</span>\n" +
    "          <span class=size-12 ng-if=\"btx.action == 'invalid'\" translate>\n" +
    "          (possible double spend)\n" +
    "          </span>\n" +
    "          <span ng-if=\"btx.action != 'invalid'\">\n" +
    "          {{btx.amountStr}}\n" +
    "          </span>\n" +
    "        </span>\n" +
    "        <div class=\"size-12 text-gray\">\n" +
    "          <time ng-if=btx.time>{{btx.time * 1000 | amTimeAgo}}</time>\n" +
    "          <span translate class=text-warning ng-show=\"!btx.time && (!btx.confirmations || btx.confirmations == 0)\">\n" +
    "            Unconfirmed\n" +
    "          </span>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div class=\"large-1 medium-1 small-1 columns text-right m10t\">\n" +
    "        <i class=\"icon-arrow-right3 size-18\"></i>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"text-gray text-center size-12 p10t\" ng-if=index.historyShowMore>\n" +
    "      <span class=size-12 translate>{{index.result.length - index.txHistorySearchResults.length}} more</span>\n" +
    "      &nbsp;\n" +
    "      <i class=icon-arrow-down4></i>\n" +
    "    </div>\n" +
    "\n" +
    "    <ion-infinite-scroll ng-if=\"index.historyShowMore && index.isSearching\" on-infinite=index.showMore() distance=1%>\n" +
    "    </ion-infinite-scroll>\n" +
    "  </ion-content>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('views/modals/tx-details.html',
    "<ion-modal-view ng-controller=txDetailsController>\n" +
    "  <ion-header-bar align-title=center class=tab-bar ng-style=\"{'background-color':color}\">\n" +
    "    <div class=left-small>\n" +
    "      <a ng-click=cancel() class=p10>\n" +
    "        <span class=text-close translate>Close</span>\n" +
    "      </a>\n" +
    "    </div>\n" +
    "    <h1 class=\"title ellipsis\" translate>Transaction</h1>\n" +
    "  </ion-header-bar>\n" +
    "\n" +
    "  <ion-content ng-style=\"{'background-color': '#F6F7F9'}\">\n" +
    "    <div class=modal-content>\n" +
    "      <div class=\"header-modal text-center\" ng-init=getAlternativeAmount(btx)>\n" +
    "        <div ng-show=\"btx.action != 'invalid'\">\n" +
    "          <div ng-show=\"btx.action == 'received'\">\n" +
    "            <img src=img/icon-receive-history.svg alt=sync width=50>\n" +
    "            <p class=\"m0 text-gray size-14\" translate>Received</p>\n" +
    "          </div>\n" +
    "          <div ng-show=\"btx.action == 'sent'\">\n" +
    "            <img src=img/icon-sent-history.svg alt=sync width=50>\n" +
    "            <p class=\"m0 text-gray size-14\" translate>Sent</p>\n" +
    "          </div>\n" +
    "          <div ng-show=\"btx.action == 'moved'\">\n" +
    "            <img src=img/icon-moved.svg alt=sync width=50>\n" +
    "            <p class=\"m0 text-gray size-14\" translate>Moved</p>\n" +
    "          </div>\n" +
    "\n" +
    "          <div class=size-36 ng-click=\"copyToClipboard(btx.amountStr, $event)\">\n" +
    "            <span class=enable_text_select>{{btx.amountStr}}</span>\n" +
    "          </div>\n" +
    "          <div class=alternative-amount ng-click=\"showRate=!showRate\" ng-init=\"showRate = false\">\n" +
    "            <span class=\"label gray radius\" ng-show=\"!showRate && alternativeAmountStr\">\n" +
    "              {{alternativeAmountStr}}\n" +
    "            </span>\n" +
    "            <span class=size-12 ng-show=\"showRate && alternativeAmountStr\">\n" +
    "              {{rateStr}} ({{rateDate | amDateFormat:'MM/DD/YYYY HH:mm a'}})\n" +
    "            </span>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "        <div ng-show=\"btx.action == 'invalid'\">\n" +
    "          -\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <h4 class=\"title m0\" translate>Details</h4>\n" +
    "\n" +
    "      <ul class=\"no-bullet size-14 m0\">\n" +
    "        <li ng-if=\"!btx.hasMultiplesOutputs && btx.addressTo && btx.addressTo != 'N/A'\" class=\"line-b p10 oh\" ng-click=\"copyToClipboard(btx.addressTo, $event)\">\n" +
    "          <span class=text-gray translate>To</span>\n" +
    "          <span class=right>\n" +
    "            <span ng-if=btx.merchant>\n" +
    "              <span ng-show=btx.merchant.pr.ca><i class=\"fi-lock color-greeni\"></i> {{btx.merchant.domain}}</span>\n" +
    "              <span ng-show=!btx.merchant.pr.ca><i class=\"fi-unlock color-yellowi\"></i> {{btx.merchant.domain}}</span>\n" +
    "            </span>\n" +
    "            <span ng-if=!btx.merchant>\n" +
    "              <span ng-show=btx.labelTo>{{btx.labelTo}}</span>\n" +
    "              <contact ng-show=!btx.labelTo class=enable_text_select address={{btx.addressTo}}></contact>\n" +
    "            </span>\n" +
    "          </span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li ng-show=btx.hasMultiplesOutputs class=\"line-b p10 oh\" ng-click=\"showMultiplesOutputs = !showMultiplesOutputs\">\n" +
    "          <span class=text-gray translate>Recipients</span>\n" +
    "          <span class=right>{{btx.recipientCount}}\n" +
    "            <i ng-show=showMultiplesOutputs class=\"icon-arrow-up3 size-24\"></i>\n" +
    "            <i ng-show=!showMultiplesOutputs class=\"icon-arrow-down3 size-24\"></i>\n" +
    "          </span>\n" +
    "        </li>\n" +
    "\n" +
    "        <div class=line-b ng-show=\"btx.hasMultiplesOutputs && showMultiplesOutputs\" ng-repeat=\"output in btx.outputs\" ng-include=\"'views/includes/output.html'\">\n" +
    "        </div>\n" +
    "\n" +
    "        <li ng-if=\"btx.action == 'invalid'\" class=\"line-b p10 oh\">\n" +
    "          <span class=right translate>\n" +
    "            This transaction has become invalid; possibly due to a double spend attempt.\n" +
    "          </span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li ng-if=btx.time class=\"line-b p10 oh\">\n" +
    "          <span class=text-gray translate>Date</span>\n" +
    "          <span class=\"right enable_text_select\">\n" +
    "            <time>{{ btx.time * 1000 | amDateFormat:'MM/DD/YYYY HH:mm a'}}</time>\n" +
    "            <time>({{ btx.time * 1000 | amTimeAgo}})</time>\n" +
    "          </span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li class=\"line-b p10\" ng-show=\"btx.action != 'received'\" ng-click=\"copyToClipboard(btx.feeStr, $event)\">\n" +
    "          <span class=text-gray translate>Fee</span>\n" +
    "          <span class=\"right enable_text_select\">{{btx.feeStr}}</span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li class=\"line-b p10 oh\" ng-if=\"btx.message && btx.action != 'received'\" ng-click=\"copyToClipboard(btx.message, $event)\">\n" +
    "          <span class=text-gray translate>Description</span>\n" +
    "          <span class=\"right enable_text_select\">{{btx.message}}</span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li ng-if=btx.merchant class=\"line-b p10 oh\" ng-click=\"copyToClipboard(btx.merchant.pr.pd.memo, $event)\">\n" +
    "          <span class=text-gray translate>Merchant message</span>\n" +
    "          <span class=\"right enable_text_select\">\n" +
    "            {{btx.merchant.pr.pd.memo}}\n" +
    "          </span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li ng-if=btx.time class=\"line-b p10 oh\">\n" +
    "          <span class=text-gray translate>Confirmations</span>\n" +
    "          <span class=right>\n" +
    "            <span class=text-warning ng-show=\"!btx.confirmations || btx.confirmations == 0\" translate>\n" +
    "              Unconfirmed\n" +
    "            </span>\n" +
    "            <span class=\"label gray radius\" ng-show=\"btx.confirmations>0 && !btx.safeConfirmed\">\n" +
    "              {{btx.confirmations}}\n" +
    "            </span>\n" +
    "            <span class=\"label gray radius\" ng-show=btx.safeConfirmed>\n" +
    "              {{btx.safeConfirmed}}\n" +
    "            </span>\n" +
    "          </span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li class=\"p10 oh\" ng-show=\"btx.note && btx.note.body\">\n" +
    "          <span class=text-gray translate>Comment</span>\n" +
    "          <span class=\"right enable_text_select\">{{btx.note.body}}</span><br>\n" +
    "          <span class=\"right text-italic text-gray size-12\">\n" +
    "            <span translate>Edited by</span> <span>{{btx.note.editedByName}}</span>,\n" +
    "            <time>{{btx.note.editedOn * 1000 | amTimeAgo}}</time></span>\n" +
    "          \n" +
    "        </li>\n" +
    "      </ul>\n" +
    "\n" +
    "      <div ng-if=\"btx.actions[0] && isShared\">\n" +
    "        <h4 class=\"title m0\" translate>Participants</h4>\n" +
    "        <ul class=\"no-bullet size-14 m0\">\n" +
    "          <li class=\"line-b p10 text-gray\" ng-repeat=\"c in btx.actions\">\n" +
    "            <i class=\"icon-contact size-24\"></i>\n" +
    "            <span class=right>\n" +
    "              <i ng-if=\"c.type == 'reject'\" class=\"fi-x icon-sign x db\"></i>\n" +
    "              <i ng-if=\"c.type == 'accept'\" class=\"fi-check icon-sign check db\"></i>\n" +
    "            </span>\n" +
    "            {{c.copayerName}} <span ng-if=\"c.copayerId == copayerId\">({{'Me'|translate}})</span>\n" +
    "          </li>\n" +
    "        </ul>\n" +
    "      </div>\n" +
    "\n" +
    "      <div ng-show=btx.txid class=tx-details-blockchain>\n" +
    "        <div class=\"text-center m20t\">\n" +
    "          <button class=\"button outline round dark-gray tiny\" ng-click=\"$root.openExternalLink('https://' +\n" +
    "            (getShortNetworkName() == 'test' ? 'test-' : '') + 'insight.bitpay.com/tx/' + btx.txid)\">\n" +
    "            <span class=text-gray translate>See it on the blockchain</span>\n" +
    "          </button>\n" +
    "          <button class=\"button outline round dark-gray tiny\" ng-click=showCommentPopup()>\n" +
    "            <span class=text-gray translate ng-show=!btx.note>Add comment</span>\n" +
    "            <span class=text-gray translate ng-show=btx.note>Edit comment</span>\n" +
    "          </button>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </ion-content>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('views/modals/tx-status.html',
    "<ion-modal-view ng-controller=txStatusController>\n" +
    "  <div ng-if=\"type == 'broadcasted'\" class=\"popup-txsent text-center\">\n" +
    "    <i class=\"small-centered columns fi-check m30tp\" ng-style=\"{'color':color, 'border-color':color}\"></i>\n" +
    "    <div ng-show=tx.amountStr class=\"m20t size-36 text-white\">\n" +
    "      {{tx.amountStr}}\n" +
    "    </div>\n" +
    "    <div class=\"size-16 text-gray\">\n" +
    "      <span translate>Sent</span>\n" +
    "    </div>\n" +
    "    <div class=\"text-center m20t\">\n" +
    "      <a class=\"button outline round light-gray tiny small-4\" ng-click=cancel() translate>OKAY</a>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "\n" +
    "  <div ng-if=\"type == 'created'\" class=popup-txsigned>\n" +
    "    <i class=\"small-centered columns fi-check m30tp\" ng-style=\"{'color':color, 'border-color':color}\"></i>\n" +
    "    <div class=\"text-center size-18 tu text-bold p20\" ng-style=\"{'color':color}\">\n" +
    "      <span translate>Payment Proposal Created</span>\n" +
    "    </div>\n" +
    "    <div class=text-center>\n" +
    "      <a class=\"button outline round light-gray tiny small-4\" ng-click=cancel() translate>OKAY</a>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "  <div ng-if=\"type == 'accepted'\" class=popup-txsigned>\n" +
    "    <i class=\"small-centered columns fi-check m30tp\" ng-style=\"{'color':color, 'border-color':color}\"></i>\n" +
    "    <div class=\"text-center size-18 text-primary tu text-bold p20\" ng-style=\"{'color':color}\">\n" +
    "      <span translate>Payment Accepted</span>\n" +
    "    </div>\n" +
    "    <div class=text-center>\n" +
    "      <a class=\"button outline round light-gray tiny small-4\" ng-click=cancel() translate>OKAY</a>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div ng-if=\"type=='rejected'\" class=popup-txrejected>\n" +
    "    <i class=\"fi-x small-centered columns m30tp\" ng-style=\"{'color':color, 'border-color':color}\"></i>\n" +
    "    <div class=\"text-center size-18 tu text-bold p20\" ng-style=\"{'color':color}\">\n" +
    "      <span translate>Payment Rejected</span>\n" +
    "    </div>\n" +
    "    <div class=text-center>\n" +
    "      <a class=\"button outline light-gray round tiny small-4\" ng-click=cancel() translate>OKAY</a>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('views/modals/txp-details.html',
    "<ion-modal-view ng-controller=txpDetailsController>\n" +
    "  <ion-header-bar align-title=center class=tab-bar ng-style=\"{'background-color':color}\">\n" +
    "    <div class=left-small>\n" +
    "      <a ng-click=cancel() class=p10>\n" +
    "        <span class=text-close translate>Close</span>\n" +
    "      </a>\n" +
    "    </div>\n" +
    "    <h1 class=\"title ellipsis\" translate>Payment Proposal</h1>\n" +
    "  </ion-header-bar>\n" +
    "\n" +
    "  <ion-content ng-style=\"{'background-color': '#F6F7F9'}\">\n" +
    "    <div class=\"modal-content fix-modals-touch\" ng-init=updateCopayerList()>\n" +
    "      <div class=payment-proposal-head ng-style=\"{'background-color':color}\">\n" +
    "        <div class=size-36>{{tx.amountStr}}</div>\n" +
    "        <div class=\"size-14 text-light\" ng-show=tx.alternativeAmountStr>{{tx.alternativeAmountStr}}</div>\n" +
    "        <i class=\"db fi-arrow-down size-24 m10v\"></i>\n" +
    "        <span class=payment-proposal-to ng-click=\"copyToClipboard(tx.toAddress, $event)\">\n" +
    "          <i class=\"fi-bitcoin left\"></i>\n" +
    "          <contact ng-if=!tx.hasMultiplesOutputs class=\"dib enable_text_select ellipsis m5t m5b size-14\" address={{tx.toAddress}}></contact>\n" +
    "          <span ng-if=tx.hasMultiplesOutputs translate>Multiple recipients</span>\n" +
    "        </span>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=oh>\n" +
    "        <div class=box-notification ng-show=error>\n" +
    "          <span class=\"text-warning size-14\">{{error|translate}}</span>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=row ng-if=tx.removed>\n" +
    "          <div class=\"column m20t text-center text-warning size-12\" translate>\n" +
    "            The payment was removed by creator\n" +
    "          </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row p20t white\" ng-if=tx.pendingForUs>\n" +
    "          <div class=\"large-6 medium-6 small-6 columns\" ng-show=isShared>\n" +
    "            <button class=\"button outline round dark-gray expand\" ng-click=reject(tx) ng-disabled=loading>\n" +
    "              <i class=fi-x></i>\n" +
    "              <span translate>Reject</span>\n" +
    "            </button>\n" +
    "          </div>\n" +
    "          <div class=\"large-6 medium-6 small-6 columns text-right\" ng-show=canSign>\n" +
    "            <button class=\"button primary round expand\" ng-click=sign(tx) ng-style=\"{'background-color':color}\" ng-disabled=\"loading || paymentExpired\">\n" +
    "              <i class=fi-check></i>\n" +
    "              <span translate>Accept</span>\n" +
    "            </button>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"text-center text-gray size-12 m20t\" ng-show=\"tx.status != 'pending'\">\n" +
    "          <div ng-show=\"tx.status=='accepted' && !tx.isGlidera\">\n" +
    "            <div class=m10b translate>Payment accepted, but not yet broadcasted</div>\n" +
    "\n" +
    "            <button class=\"primary round m0\" ng-style=\"{'background-color':color}\" ng-click=broadcast(tx) ng-disabled=loading>\n" +
    "              <i class=fi-upload-cloud></i>\n" +
    "              <span translate>Broadcast Payment</span>\n" +
    "            </button>\n" +
    "          </div>\n" +
    "          <div ng-show=\"tx.status=='accepted' && tx.isGlidera\">\n" +
    "            <div class=m10h translate>Payment accepted. It will be broadcasted by Glidera. In case there is a problem, it can be deleted 6 hours after it was created.</div>\n" +
    "          </div>\n" +
    "          <div class=text-success ng-show=\"tx.status == 'broadcasted'\" translate>Payment Sent</div>\n" +
    "          <div class=text-warning ng-show=\"tx.status=='rejected'\" translate>Payment Rejected</div>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <h4 class=\"title m0\" translate>Details</h4>\n" +
    "\n" +
    "      <ul class=\"no-bullet size-14 m0\">\n" +
    "        <li class=\"line-b p10 oh\" ng-show=tx.message>\n" +
    "          <span class=text-gray translate>Description</span>\n" +
    "          <span class=right>{{tx.message}}</span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li ng-show=tx.hasMultiplesOutputs class=\"line-b p10 oh\" ng-click=\"showMultiplesOutputs = !showMultiplesOutputs\">\n" +
    "          <span class=text-gray translate>Recipients</span>\n" +
    "          <span class=right>{{tx.recipientCount}}\n" +
    "            <i ng-show=showMultiplesOutputs class=\"icon-arrow-up3 size-24\"></i>\n" +
    "            <i ng-show=!showMultiplesOutputs class=\"icon-arrow-down3 size-24\"></i>\n" +
    "          </span>\n" +
    "        </li>\n" +
    "\n" +
    "        <div class=line-b ng-show=\"tx.hasMultiplesOutputs && showMultiplesOutputs\" ng-repeat=\"output in tx.outputs\" ng-include=\"'views/includes/output.html'\">\n" +
    "        </div>\n" +
    "\n" +
    "        <li class=\"line-b p10\">\n" +
    "          <span class=text-gray translate>Fee</span>\n" +
    "          <span class=right>{{tx.feeStr}}</span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li class=\"line-b p10\">\n" +
    "          <span class=text-gray translate>Time</span>\n" +
    "          <span class=right>\n" +
    "            <time>{{ (tx.ts || tx.createdOn ) * 1000 | amTimeAgo}}</time>\n" +
    "          </span>\n" +
    "        </li>\n" +
    "\n" +
    "        <li class=\"line-b p10 oh\">\n" +
    "          <span class=text-gray translate>Created by</span>\n" +
    "          <span class=right>{{tx.creatorName}}</span>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "\n" +
    "      <div class=\"p10 text-center size-12\" ng-show=\"!currentSpendUnconfirmed && tx.hasUnconfirmedInputs\">\n" +
    "        <span class=text-warning translate>Warning: this transaction has unconfirmed inputs</span>\n" +
    "      </div>\n" +
    "\n" +
    "      <div ng-if=tx.paypro>\n" +
    "        <h4 class=\"title m0\" translate>Payment details</h4>\n" +
    "        <ul class=\"no-bullet size-14 m0\">\n" +
    "          <li class=\"line-b p10\">\n" +
    "            <span class=text-gray translate>To</span>\n" +
    "            <span class=right>\n" +
    "              <span>\n" +
    "                <span ng-show=tx.merchant.pr.ca><i class=fi-lock></i> {{tx.paypro.domain}}</span>\n" +
    "                <span ng-show=!tx.merchant.pr.ca><i class=fi-unlock></i> {{tx.paypro.domain}}</span>\n" +
    "              </span>\n" +
    "              <contact address={{tx.toAddress}} ng-hide=tx.merchant></contact>\n" +
    "            </span>\n" +
    "          </li>\n" +
    "          <li class=\"line-b p10\" ng-if=paymentExpired>\n" +
    "            <span class=text-gray translate>Expired</span>\n" +
    "            <span class=\"right text-alert\">\n" +
    "              <time>{{tx.paypro.expires * 1000 | amTimeAgo }}</time>\n" +
    "            </span>\n" +
    "          </li>\n" +
    "          <li class=\"line-b p10\" ng-if=!paymentExpired>\n" +
    "            <span class=text-gray translate>Expires</span>\n" +
    "            <span class=right>\n" +
    "              <time>{{expires}}</time>\n" +
    "            </span>\n" +
    "          </li>\n" +
    "          <li class=\"line-b p10\">\n" +
    "            <span class=text-gray>Merchant Message</span>\n" +
    "            <span class=db>{{tx.paypro.pr.pd.memo}}</span>\n" +
    "          </li>\n" +
    "        </ul>\n" +
    "      </div>\n" +
    "\n" +
    "      <div ng-if=\"tx.actions[0] && !txRejected && !txBroadcasted\">\n" +
    "        <h4 class=\"title m0\">\n" +
    "          <div class=\"right size-12 text-gray m10r\">\n" +
    "            {{tx.requiredSignatures}}/{{tx.walletN}}\n" +
    "          </div>\n" +
    "          <span translate>Participants</span>\n" +
    "        </h4>\n" +
    "        <ul class=\"no-bullet size-14 m0\">\n" +
    "          <li class=\"line-b p10 text-gray\" ng-repeat=\"ac in tx.actions\">\n" +
    "            <i class=\"icon-contact size-24\"></i>\n" +
    "            <span class=right>\n" +
    "              <i ng-if=\"ac.type == 'reject'\" class=\"fi-x icon-sign x db\"></i>\n" +
    "              <i ng-if=\"ac.type == 'accept'\" class=\"fi-check icon-sign check db\"></i>\n" +
    "            </span>\n" +
    "            {{ac.copayerName}} <span ng-if=\"ac.copayerId == copayerId\">({{'Me'|translate}})</span>\n" +
    "          </li>\n" +
    "        </ul>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"columns text-center m20t\" ng-if=\"tx.canBeRemoved || (tx.status == 'accepted' && !tx.broadcastedOn)\">\n" +
    "        <div class=\"text-gray size-12 m20b\" ng-show=\"!tx.isGlidera && isShared\" translate>\n" +
    "          * A payment proposal can be deleted if 1) you are the creator, and no other copayer has signed, or 2) 24 hours have passed since the proposal was created.\n" +
    "        </div>\n" +
    "        <button class=\"tiny round outline dark-gray warning\" ng-click=remove(tx) ng-disabled=loading>\n" +
    "          <i class=\"fi-trash size-14 m5r\"></i>\n" +
    "          <span translate>Delete Payment Proposal</span>\n" +
    "        </button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </ion-content>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('views/modals/wallets.html',
    "<ion-modal-view ng-controller=walletsController>\n" +
    "  <ion-header-bar align-title=center class=tab-bar>\n" +
    "    <div class=left-small>\n" +
    "      <a ng-click=cancel() class=p10>\n" +
    "        <span class=text-close>Close</span>\n" +
    "      </a>\n" +
    "    </div>\n" +
    "    <h1 class=\"title ellipsis\">\n" +
    "      <span ng-show=\"type == 'BUY' || type == 'RECEIVE'\">Choose your destination wallet</span>\n" +
    "      <span ng-show=\"type == 'SELL' || type == 'SEND' || type == 'GIFT'\">Choose your source wallet</span>\n" +
    "    </h1>\n" +
    "  </ion-header-bar>\n" +
    "\n" +
    "  <ion-content ng-style=\"{'background-color': '#F6F7F9'}\">\n" +
    "\n" +
    "    <div class=modal-content>\n" +
    "      <div class=\"box-notification text-center size-12 text-warning m10t\" ng-show=error>\n" +
    "        <i class=fi-error></i> {{error}}\n" +
    "      </div>\n" +
    "      <div ng-show=\"type == 'SELL' || type == 'GIFT'\">\n" +
    "        <h4 class=\"title m0 oh\">\n" +
    "          <div class=left>\n" +
    "            <i class=\"fi-info size-18 m10r\"></i>\n" +
    "          </div>\n" +
    "          <div class=\"size-10 m5t\" ng-show=\"type == 'SELL'\">\n" +
    "            Notice: only 1-1 (single signature) wallets can be used to sell bitcoin\n" +
    "          </div>\n" +
    "          <div class=\"size-10 m5t\" ng-show=\"type == 'GIFT'\">\n" +
    "            Notice: only 1-1 (single signature) wallets can be used to buy a gift card\n" +
    "          </div>\n" +
    "        </h4>\n" +
    "      </div>\n" +
    "      <div ng-show=\"type != 'SELL' && type != 'GIFT'\">\n" +
    "        <h4 class=\"title m0 oh\">\n" +
    "        </h4>\n" +
    "      </div>\n" +
    "      <ul class=no-bullet>\n" +
    "        <li class=line-b ng-repeat=\"w in wallets\">\n" +
    "        <a ng-click=selectWallet(w.id) class=\"db oh\">\n" +
    "          <div class=avatar-wallet ng-style=\"{'background-color':w.color}\">\n" +
    "            <i class=\"icon-wallet size-21\"></i>\n" +
    "          </div>\n" +
    "          <div class=\"ellipsis name-wallet text-bold\">\n" +
    "            {{w.name || w.id}}\n" +
    "            <span class=\"has-error right text-light size-12\" ng-show=errorSelectedWallet[w.id]>\n" +
    "              <i class=\"icon-close-circle size-14\"></i>\n" +
    "              <span class=vm>{{errorSelectedWallet[w.id]}}</span>\n" +
    "            </span>\n" +
    "          </div>\n" +
    "          <div class=size-12>{{w.m}} of {{w.n}}\n" +
    "            <span ng-show=\"w.network=='testnet'\">[Testnet]</span>\n" +
    "          </div>\n" +
    "        </a>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "      <div class=extra-margin-bottom></div>\n" +
    "    </div>\n" +
    "  </ion-content>\n" +
    "</ion-modal-view>\n"
  );


  $templateCache.put('views/notFound.html',
    "<div class=\"content text-center\">\n" +
    "  No such wallet. Please check you URL.\n" +
    "</div>\n"
  );


  $templateCache.put('views/paperWallet.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Sweep paper wallet'; goBackToState = 'preferencesAdvanced';\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=paperWalletController>\n" +
    "  <div class=row ng-show=index.needsBackup>\n" +
    "    <div class=columns>\n" +
    "      <h4></h4>\n" +
    "      <div class=\"size-14 text-warning m20b\">\n" +
    "        <i class=\"fi-alert size-12\"></i>\n" +
    "        <span class=text-warning translate>Backup Needed</span>.\n" +
    "        <span translate>\n" +
    "          Before receiving funds, you must backup your wallet. If this device is lost, it is impossible to access your funds without a backup.\n" +
    "        </span>\n" +
    "      </div>\n" +
    "      <div class=\"text-center m20t\">\n" +
    "      <a class=\"button outline round dark-gray\" href ui-sref=preferences>\n" +
    "        <span translate>Preferences</span>\n" +
    "      </a>\n" +
    "    </div>\n" +
    "    </div>\n" +
    "\n" +
    "  </div>\n" +
    "  <div ng-show=!index.needsBackup>\n" +
    "    <h4 ng-show=!error></h4>\n" +
    "    <div class=\"box-notification m20b\" ng-show=error>\n" +
    "      <span class=text-warning>{{error|translate}}</span>\n" +
    "    </div>\n" +
    "    <form ng-show=!balance class=oh>\n" +
    "      <div class=row>\n" +
    "        <div class=\"large-12 medium-12 columns\">\n" +
    "          <div class=input>\n" +
    "            <label for=inputData translate>Paper Wallet Private Key</label>\n" +
    "            <input placeholder=\"{{'Paste your paper wallet private key here'|translate}}\" ng-model=inputData id=inputData ng-change=onData(inputData)>\n" +
    "            <div class=qr-scanner-input>\n" +
    "              <qr-scanner on-scan=onQrCodeScanned(data)></qr-scanner>\n" +
    "            </div>\n" +
    "            <div ng-show=isPkEncrypted>\n" +
    "              <label for=passphrase>\n" +
    "                <span translate>Password</span>\n" +
    "              </label>\n" +
    "              <input id=passphrase type=password name=passphrase placeholder=\"{{'Passphrase'|translate}}\" ng-model=passphrase>\n" +
    "              <p ng-show=index.isCordova translate class=\"size-12 text-gray\">\n" +
    "                Decrypting a paper wallet could take around 5 minutes on this device. please be patient and keep the app open.\n" +
    "              </p>\n" +
    "            </div>\n" +
    "            <button ng-disabled=\"scanning || !scannedKey\" ng-style=\"{'background-color':index.backgroundColor}\" class=\"button black round expand\" ng-click=scanFunds() translate>Scan Wallet Funds\n" +
    "            </button>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </form>\n" +
    "    <div ng-show=balance class=row>\n" +
    "       <div class=\"large-12 medium-12 columns\">\n" +
    "         <div class=\"text-center m20b\">\n" +
    "           <h4 class=text-bold translate>Funds found</h4>\n" +
    "           <div class=size-24>\n" +
    "             {{balance}}\n" +
    "           </div>\n" +
    "         </div>\n" +
    "\n" +
    "        <button ng-disabled=\"sending || balanceSat <= 0\" ng-style=\"{'background-color':index.backgroundColor}\" class=\"button black round expand\" ng-click=sweepWallet() translate>Sweep Wallet\n" +
    "        </button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <div class=\"text-center size-12 text-gray\">\n" +
    "      <span translate>Funds will be transferred to</span>:\n" +
    "      <b>{{index.alias || index.walletName}}</b>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/paymentUri.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Choose wallet'; closeToHome = true\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content p20v row payment-uri\" ng-controller=\"paymentUriController as payment\">\n" +
    "  <div class=\"large-12 columns\" ng-init=payment.init()>\n" +
    "    <div class=\"panel text-center\" ng-if=!payment.uri>\n" +
    "      <h1 translate>Bitcoin URI is NOT valid!</h1>\n" +
    "    </div>\n" +
    "    <div ng-if=payment.uri ng-init=payment.getWallets(payment.uri.network)>\n" +
    "      <h1 translate>Make a payment to</h1>\n" +
    "      <div class=\"panel size-14\">\n" +
    "        <div class=ellipsis><b translate>Address</b>: {{payment.uri.address.toString()}}</div>\n" +
    "        <div ng-show=payment.uri.amount><b translate>Amount</b>: {{payment.uri.amount}}</div>\n" +
    "        <div ng-show=payment.uri.message><b translate>Message</b>: {{payment.uri.message}}</div>\n" +
    "        <div ng-show=\"payment.uri.network == 'testnet'\"><b translate>Network</b>: {{payment.uri.network}}</div>\n" +
    "      </div>\n" +
    "      <div ng-if=\"!wallets || !wallets.length\">\n" +
    "        <div class=box-notification>\n" +
    "          <span class=text-warning>\n" +
    "            <b translate>There are no wallets to make this payment</b>\n" +
    "            <span ng-show=\"payment.uri.network == 'testnet'\">[testnet]</span>\n" +
    "          </span>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div ng-if=wallets.length>\n" +
    "        <h2 translate>Select a wallet</h2>\n" +
    "        <ul class=no-bullet>\n" +
    "          <li class=panel ng-repeat=\"w in wallets\">\n" +
    "          <a ng-click=payment.selectWallet(w.id)>\n" +
    "            <div class=avatar-wallet ng-style=\"{'background-color':w.color}\">\n" +
    "              <i class=\"icon-wallet size-21\"></i>\n" +
    "            </div>\n" +
    "            <div class=ellipsis>{{w.name || w.id}}</div>\n" +
    "            <div class=size-12>{{w.m}} of {{w.n}}\n" +
    "              <span ng-show=\"w.network=='testnet'\">[Testnet]</span>\n" +
    "            </div>\n" +
    "          </a>\n" +
    "          </li>\n" +
    "        </ul>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('views/preferences.html',
    "\n" +
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection=index.setWalletPreferencesTitle(); closeToHome = true\">\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=preferencesController ng-init=init()>\n" +
    "\n" +
    "  <h4></h4>\n" +
    "\n" +
    "  <ul class=\"no-bullet m0\" ng-show=!index.noFocusedWallet>\n" +
    "\n" +
    "    <li href ui-sref=preferencesAlias>\n" +
    "      <div class=\"right text-gray\">\n" +
    "        {{index.alias||index.walletName}}\n" +
    "        <i class=\"icon-arrow-right3 size-24 right\"></i>\n" +
    "      </div>\n" +
    "      <div translate>Alias</div>\n" +
    "    </li>\n" +
    "\n" +
    "    <li href ui-sref=preferencesEmail>\n" +
    "      <div class=\"right text-gray\">\n" +
    "        <span ng-if=!index.preferences.email translate>Disabled</span>\n" +
    "        <span ng-if=index.preferences.email>{{index.preferences.email}}</span>\n" +
    "        <i class=\"icon-arrow-right3 size-24 right\"></i>\n" +
    "      </div>\n" +
    "      <div translate>Email Notifications</div>\n" +
    "    </li>\n" +
    "\n" +
    "    <li ng-hide=index.noUserColors href ui-sref=preferencesColor>\n" +
    "      <div class=\"right text-gray\">\n" +
    "        <span ng-style=\"{'color':index.backgroundColor}\">&block;</span>\n" +
    "        <i class=\"icon-arrow-right3 size-24 right\"></i>\n" +
    "      </div>\n" +
    "      <div translate>Color</div>\n" +
    "    </li>\n" +
    "\n" +
    "    <li ng-show=index.isPrivKeyExternal>\n" +
    "      <div class=\"right text-gray m10r\">\n" +
    "        {{externalSource}}\n" +
    "      </div>\n" +
    "      <div translate>Hardware wallet</div>\n" +
    "    </li>\n" +
    "\n" +
    "    <li href ui-sref=backup ng-hide=index.isPrivKeyExternal>\n" +
    "      <div class=\"right text-gray\">\n" +
    "        <span class=text-warning ng-show=index.needsBackup>\n" +
    "          <i class=fi-alert></i> <span translate>Not completed</span>\n" +
    "        </span>\n" +
    "        <i class=\"icon-arrow-right3 size-24 text-gray\"></i>\n" +
    "      </div>\n" +
    "      <div translate>Backup</div>\n" +
    "    </li>\n" +
    "\n" +
    "    <li href ui-sref=preferencesAdvanced>\n" +
    "      <i class=\"icon-arrow-right3 size-24 right text-gray\"></i>\n" +
    "      <div translate>Advanced</div>\n" +
    "    </li>\n" +
    "\n" +
    "  </ul>\n" +
    "\n" +
    "  <h4 translate ng-show=\"index.canSign || !deleted\">\n" +
    "    Security preferences\n" +
    "  </h4>\n" +
    "\n" +
    "  <div ng-show=\"!index.noFocusedWallet && index.canSign\">\n" +
    "    <ion-toggle ng-model=encryptEnabled toggle-class=toggle-balanced ng-change=encryptChange()>\n" +
    "      <span class=toggle-label translate>Request Spending Password</span>\n" +
    "    </ion-toggle>\n" +
    "\n" +
    "    <ion-toggle ng-model=touchidEnabled toggle-class=toggle-balanced ng-change=touchidChange() ng-show=touchidAvailable>\n" +
    "      <span class=toggle-label translate>Scan Fingerprint</span>\n" +
    "    </ion-toggle>\n" +
    "  </div>\n" +
    "  <div ng-show=!deleted>\n" +
    "\n" +
    "    <ul class=\"no-bullet m0\">\n" +
    "      <li href ui-sref=deleteWords>\n" +
    "        <i class=\"icon-arrow-right3 size-24 right text-gray\"></i>\n" +
    "        <div translate>Delete recovery phrase</div>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "\n" +
    "  </div>\n" +
    "\n" +
    " <h4></h4>\n" +
    "</div>\n" +
    "\n" +
    "<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/preferencesAbout.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='About Copay'; goBackToState = 'preferencesGlobal'; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=\"preferencesAbout as about\">\n" +
    "    <h4 translate>Release Information</h4>\n" +
    "    <div ng-controller=\"versionController as v\">\n" +
    "      <ul class=\"no-bullet m0\">\n" +
    "        <li ng-conf>\n" +
    "          <span translate>Version</span>\n" +
    "          <span class=\"right text-gray\">\n" +
    "            v{{v.version}}\n" +
    "          </span>\n" +
    "        </li>\n" +
    "        <li ng-conf ng-click=\"$root.openExternalLink('https://github.com/bitpay/copay/tree/'+v.commitHash)\">\n" +
    "          <span translate>Commit hash</span>\n" +
    "          <span class=\"right text-gray\">\n" +
    "            #{{v.commitHash}}\n" +
    "          </span>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <h4></h4>\n" +
    "    <ul class=\"no-bullet m0\">\n" +
    "      <li href ui-sref=termOfUse>\n" +
    "        <i class=\"icon-arrow-right3 size-24 right text-gray\"></i>\n" +
    "        <span translate>Terms of Use</span>\n" +
    "      </li>\n" +
    "      <li href ui-sref=translators>\n" +
    "        <i class=\"icon-arrow-right3 size-24 right text-gray\"></i>\n" +
    "        <span translate>Translators</span>\n" +
    "      </li>\n" +
    "      <li ng-conf href ui-sref=logs>\n" +
    "        <i class=\"icon-arrow-right3 size-24 right text-gray\"></i>\n" +
    "        <span translate>Session log</span>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('views/preferencesAdvanced.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Advanced'; goBackToState = 'preferences'\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content preferences\">\n" +
    "\n" +
    "  <h4></h4>\n" +
    "\n" +
    "  <ul class=\"no-bullet m0\">\n" +
    "\n" +
    "    <li href ui-sref=information>\n" +
    "      <i class=\"icon-arrow-right3 size-24 right text-gray\"></i>\n" +
    "      <div translate>Wallet Information</div>\n" +
    "    </li>\n" +
    "\n" +
    "    <li ng-show=\"index.network == 'livenet'\" href ui-sref=paperWallet>\n" +
    "      <i class=\"icon-arrow-right3 size-24 right text-gray\"></i>\n" +
    "      <div translate>Sweep paper wallet</div>\n" +
    "    </li>\n" +
    "\n" +
    "    <li href ui-sref=export>\n" +
    "      <i class=\"icon-arrow-right3 size-24 right text-gray\"></i>\n" +
    "      <div translate>Export Wallet</div>\n" +
    "    </li>\n" +
    "\n" +
    "    <li href ui-sref=preferencesBwsUrl>\n" +
    "      <i class=\"icon-arrow-right3 size-24 right text-gray\"></i>\n" +
    "      <div>Wallet Service URL</div>\n" +
    "    </li>\n" +
    "\n" +
    "     <li href ui-sref=preferencesHistory>\n" +
    "      <i class=\"icon-arrow-right3 size-24 right text-gray\"></i>\n" +
    "      <div translate>Transaction History</div>\n" +
    "    </li>\n" +
    "\n" +
    "    <li href ui-sref=delete>\n" +
    "      <i class=\"icon-arrow-right3 size-24 right text-gray\"></i>\n" +
    "      <div translate>Delete Wallet</div>\n" +
    "    </li>\n" +
    "\n" +
    "  </ul>\n" +
    "\n" +
    "</div>\n" +
    "<div class=extra-margin-bottom></div>\n" +
    "\n"
  );


  $templateCache.put('views/preferencesAlias.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Alias'; goBackToState = 'preferences'\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=preferencesAliasController>\n" +
    "\n" +
    "  <h4></h4>\n" +
    "  <form name=settingsAliasForm ng-submit=save() class=columns>\n" +
    "    <label><span translate>Alias for <i>{{index.walletName}}</i></span></label>\n" +
    "    <input id=alias2 name=alias2 ng-model=alias>\n" +
    "    <input type=submit class=\"button expand black round\" value=\"{{'Save'|translate}}\" ng-style=\"{'background-color':index.backgroundColor}\">\n" +
    "  </form>\n" +
    "    <div class=\"text-gray size-12 text-center\" translate>Changing wallet alias only affects the local wallet name.\n" +
    "  </div>\n" +
    "</div>\n" +
    "<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/preferencesAltCurrency.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Alternative Currency'; goBackToState = 'preferencesGlobal'; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=preferencesAltCurrencyController ng-init=init()>\n" +
    "  <h4></h4>\n" +
    "\n" +
    "  <ion-content>\n" +
    "    <ion-radio class=\"line-b size-12 radio-label\" ng-repeat=\"altCurrency in altCurrencyList\" ng-value=altCurrency.isoCode ng-model=currentCurrency ng-click=save(altCurrency)>{{altCurrency.name}}\n" +
    "    </ion-radio>\n" +
    "    <ion-infinite-scroll ng-if=!listComplete on-infinite=loadMore() distance=1%>\n" +
    "    </ion-infinite-scroll>\n" +
    "  </ion-content>\n" +
    "</div>\n" +
    "\n"
  );


  $templateCache.put('views/preferencesBwsUrl.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Wallet Service URL'; goBackToState = 'preferencesAdvanced';\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=preferencesBwsUrlController>\n" +
    "  <h4></h4>\n" +
    "  <form name=settingsBwsUrlForm ng-submit=save() class=columns>\n" +
    "    <label class=left>Wallet Service URL</label>\n" +
    "    <a class=\"right size-12\" ng-click=resetDefaultUrl() translate> Set default url</a>\n" +
    "    <input id=bwsurl name=bwsurl ng-model=bwsurl>\n" +
    "    <input type=submit class=\"button expand black round\" value=\"{{'Save'|translate}}\" ng-style=\"{'background-color':index.backgroundColor}\">\n" +
    "  </form>\n" +
    "</div>\n" +
    "<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/preferencesCoinbase.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Preferences'; goBackToState = 'coinbase'; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=\"preferencesCoinbaseController as coinbase\">\n" +
    "\n" +
    "  <ul ng-if=\"index.coinbaseAccount && !index.coinbaseError\" class=\"no-bullet m0\">\n" +
    "    <h4 class=\"title m0\">Account</h4>\n" +
    "    <li>\n" +
    "    <span>ID</span>\n" +
    "    <span class=\"right text-gray enable_text_select\">\n" +
    "      {{index.coinbaseAccount.id}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Name</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{index.coinbaseAccount.name}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Balance</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{index.coinbaseAccount.balance.amount}} {{index.coinbaseAccount.balance.currency}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Native Balance</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{index.coinbaseAccount.native_balance.amount}} {{index.coinbaseAccount.native_balance.currency}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "\n" +
    "    <h4 class=\"title m0\">User Information</h4> \n" +
    "    <li>\n" +
    "    <span>ID</span>\n" +
    "    <span class=\"right text-gray enable_text_select\">\n" +
    "      {{index.coinbaseUser.id}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Email</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{index.coinbaseUser.email}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "  <ul class=\"no-bullet m0\">\n" +
    "    <h4></h4>\n" +
    "    <li ng-click=coinbase.revokeToken(index.coinbaseTestnet)>\n" +
    "      <i class=\"icon-arrow-right3 size-24 right text-gray\"></i>\n" +
    "      <span class=text-warning>Log out</span>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "  <h4></h4>\n" +
    "\n" +
    "</div>\n" +
    "<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/preferencesColor.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Color'; goBackToState = 'preferences'\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=preferencesColorController>\n" +
    "  <h4></h4>\n" +
    "\n" +
    "  <ion-radio class=size-12 ng-repeat=\"c in colorList\" ng-value=c ng-model=currentColor ng-click=save(c)>\n" +
    "    <span ng-style=\"{'color': c}\">&block;</span>\n" +
    "  </ion-radio>\n" +
    "</div>\n"
  );


  $templateCache.put('views/preferencesDeleteWallet.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Delete Wallet'; goBackToState = 'preferencesAdvanced'\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=preferencesDeleteWalletController>\n" +
    "  <div class=\"text-center text-gray m20v size-12\">\n" +
    "    <div class=\"text-warning size-18 m10b\" translate>Warning!</div>\n" +
    "    <div class=m10 translate>Permanently delete this wallet. THIS ACTION CANNOT BE REVERSED</div>\n" +
    "  </div>\n" +
    "\n" +
    "  <ul class=\"no-bullet m0\">\n" +
    "    <li ng-click=deleteWallet()>\n" +
    "      <div class=right ng-style=\"{'color':index.backgroundColor}\" ng-show=!isDeletingWallet>\n" +
    "        {{index.walletName}} <span ng-show=index.alias>({{index.alias}})</span>\n" +
    "      </div>\n" +
    "      <div translate>Delete wallet</div>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "</div>\n"
  );


  $templateCache.put('views/preferencesDeleteWords.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Delete Recovery Phrase'; goBackToState = 'preferences'\">\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=preferencesDeleteWordsController>\n" +
    "\n" +
    "  <div ng-show=!deleted>\n" +
    "    <div class=\"text-center text-gray m20t size-12\">\n" +
    "      <div class=\"box-notification text-warning\" ng-show=error>\n" +
    "        {{error|translate}}\n" +
    "      </div>\n" +
    "      <div class=\"text-warning size-18 m10b\" translate>Warning!</div>\n" +
    "      <div class=m15 ng-show=!index.needsBackup translate>Once you have copied your wallet recovery phrase down, it is recommended to delete it from this device.</div>\n" +
    "      <div class=m15 ng-show=index.needsBackup translate>Need to do backup</div>\n" +
    "    </div>\n" +
    "    <ul class=\"no-bullet m0\" ng-show=!index.needsBackup>\n" +
    "      <li ng-click=delete()>\n" +
    "        <div class=right ng-style=\"{'color':index.backgroundColor}\">\n" +
    "          {{index.walletName}} <span ng-show=index.alias>({{index.alias}})</span>\n" +
    "        </div>\n" +
    "        <div translate>Delete Recovery Phrase</div>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"row m20t\" ng-show=deleted>\n" +
    "    <div class=\"columns size-14 text-gray text-center\" translate>\n" +
    "      Wallet recovery phrase not available. You can still export it from Advanced &gt; Export.\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('views/preferencesEmail.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Email Notifications'; goBackToState = 'preferences'\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=preferencesEmailController>\n" +
    "  <h4></h4>\n" +
    "\n" +
    "  <form name=emailForm ng-submit=save(emailForm) class=columns novalidate ng-init=\"email = index.preferences.email\">\n" +
    "    <div class=box-notification ng-show=error>\n" +
    "      <span class=\"text-warning size-14\">\n" +
    "        {{error|translate}}\n" +
    "      </span>\n" +
    "    </div>\n" +
    "\n" +
    "    <label translate>Email for wallet notifications</label>\n" +
    "    <input type=email id=email name=email ng-model=email required>\n" +
    "    <input type=submit class=\"button expand black round\" value=\"{{'Save'|translate}}\" ng-style=\"{'background-color':index.backgroundColor}\" ng-disabled=\"emailForm.$invalid && !index.preferences.email\">\n" +
    "  </form>\n" +
    "  <div class=\"text-gray size-12 text-center\" translate>Setting up email notifications could weaken your privacy, if the wallet service provider is compromised. Information available to an attacker would include your wallet addresses and its balance, but no more.\n" +
    "  </div>\n" +
    "</div>\n" +
    "<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/preferencesFee.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Bitcoin Network Fee Policy'; goBackToState = 'preferencesGlobal'; noColor = true\">\n" +
    "</div>\n" +
    "<div class=\"content preferences\" ng-controller=preferencesFeeController>\n" +
    "  <h4></h4>\n" +
    "  <div class=preferences-fee ng-show=loading>\n" +
    "    <div class=\"row p20 text-center\">\n" +
    "      <div class=\"columns large-12 medium-12 small-12 m10b\">\n" +
    "        <ion-spinner class=spinner-dark icon=lines></ion-spinner>\n" +
    "      </div>\n" +
    "      <div class=\"size-12 text-gray m20t\" translate>\n" +
    "        Loading...\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <ion-radio class=\"libe-b size-12 radio-label\" ng-repeat=\"fee in feeLevels.livenet\" ng-value=fee.level ng-model=currentFeeLevel ng-click=save(fee)>{{feeOpts[fee.level]|translate}}\n" +
    "  </ion-radio>\n" +
    "\n" +
    "  <div class=\"row m20t\">\n" +
    "    <div class=\"text-gray size-12 text-center\" ng-repeat=\"fee in feeLevels.livenet\" ng-if=\"fee.level == currentFeeLevel\">\n" +
    "      <div ng-show=fee.nbBlocks>\n" +
    "        <span class=text-bold translate>Average confirmation time: {{fee.nbBlocks * 10}} minutes</span>.\n" +
    "      </div>\n" +
    "      <span class=text-bold translate>Current fee rate for this policy: {{fee.feePerKBUnit}}/kiB</span>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=m15>\n" +
    "    <div class=\"text-gray size-12 text-center\" translate>\n" +
    "      Bitcoin transactions may include a fee collected by miners on the network. The higher the fee, the greater the incentive a miner has to include that transaction in a block. Current fees are determined based on network load and the selected policy.\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/preferencesGlidera.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Preferences'; goBackToState = 'glidera'; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=\"preferencesGlideraController as glidera\">\n" +
    "\n" +
    "  <ul ng-if=index.glideraToken class=\"no-bullet m0\">\n" +
    "    <h4 class=\"title m0\">Permissions</h4>\n" +
    "    <li>\n" +
    "    <span>Email</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{index.glideraPermissions.view_email_address}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Personal Information</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{index.glideraPermissions.personal_info}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Buy/Sell</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{index.glideraPermissions.transact}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Transaction History</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{index.glideraPermissions.transaction_history}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "\n" +
    "  <ul ng-if=index.glideraPermissions.view_email_address ng-init=glidera.getEmail(index.glideraToken) class=\"no-bullet m0\">\n" +
    "    <h4 class=\"title m0\">Email</h4>\n" +
    "    <li>\n" +
    "    <span>Email</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.email.email}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Active</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.email.userEmailIsSetup}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "\n" +
    "  <ul ng-if=index.glideraPermissions.personal_info ng-init=glidera.getPersonalInfo(index.glideraToken) class=\"no-bullet m0\">\n" +
    "    <h4 class=\"title m0\">Personal Information</h4>\n" +
    "\n" +
    "    <li>\n" +
    "    <span>First Name</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.personalInfo.firstName}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Middle Name</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.personalInfo.middleName}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Last Name</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.personalInfo.lastName}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Birth Date</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.personalInfo.birthDate}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Address 1</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.personalInfo.address1}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Address 2</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.personalInfo.address2}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>City</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.personalInfo.city}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>State</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.personalInfo.state}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>ZIP Code</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.personalInfo.zipCode}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Country</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.personalInfo.countryCode}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Occupation</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.personalInfo.occupation}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Basic Information State</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.personalInfo.basicInfoState}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "\n" +
    "  <ul ng-if=index.glideraToken ng-init=glidera.getStatus(index.glideraToken) class=\"no-bullet m0\">\n" +
    "    <h4 class=\"title m0\">Status</h4>\n" +
    "\n" +
    "    <li>\n" +
    "    <span>Buy/Sell</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.status.userCanTransact}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "\n" +
    "    <li>\n" +
    "    <span>Buy</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.status.userCanBuy}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Sell</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.status.userCanSell}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Email Is Setup</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.status.userEmailIsSetup}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Phone Is Setup</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.status.userPhoneIsSetup}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Bank Account Is Setup</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.status.userBankAccountIsSetup}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Personal Information State</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.status.personalInfoState}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Bank Account State</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.status.bankAccountState}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Country</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.status.country}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "\n" +
    "  <ul ng-if=index.glideraToken ng-init=glidera.getLimits(index.glideraToken) class=\"no-bullet m0\">\n" +
    "    <h4 class=\"title m0\">Limits</h4>\n" +
    "\n" +
    "    <li>\n" +
    "    <span>Daily Buy</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.limits.dailyBuy|currency:'':2}} {{glidera.limits.currency}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Daily Sell</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.limits.dailySell|currency:'':2}} {{glidera.limits.currency}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Monthly Buy</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.limits.monthlyBuy|currency:'':2}} {{glidera.limits.currency}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Monthly Sell</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.limits.monthlySell|currency:'':2}} {{glidera.limits.currency}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Daily Buy Remaining</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.limits.dailyBuyRemaining|currency:'':2}} {{glidera.limits.currency}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Daily Sell Remaining</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.limits.dailySellRemaining|currency:'':2}} {{glidera.limits.currency}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Monthly Buy Remaining</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.limits.monthlyBuyRemaining|currency:'':2}} {{glidera.limits.currency}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Monthly Sell Remaining</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.limits.monthlySellRemaining|currency:'':2}} {{glidera.limits.currency}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "    <li>\n" +
    "    <span>Buy/Sell Disabled (pending first transaction)</span>\n" +
    "    <span class=\"right text-gray\">\n" +
    "      {{glidera.limits.transactDisabledPendingFirstTransaction}}\n" +
    "    </span>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "\n" +
    "  <ul class=\"no-bullet m0\">\n" +
    "    <h4 class=\"title m0\">Account</h4>\n" +
    "\n" +
    "    <li ng-click=glidera.revokeToken(index.glideraTestnet)>\n" +
    "    <i class=\"icon-arrow-right3 size-24 right text-gray\"></i>\n" +
    "    <span class=text-warning>Log out</span>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "  <h4></h4>\n" +
    "\n" +
    "</div>\n" +
    "<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/preferencesGlobal.html',
    "\n" +
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Global preferences'; closeToHome = true; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=preferencesGlobalController ng-init=init()>\n" +
    "  <h4></h4>\n" +
    "  <ul class=\"no-bullet m0\">\n" +
    "    <li href ui-sref=preferencesLanguage>\n" +
    "      <div class=\"right text-gray\">\n" +
    "        {{currentLanguageName|translate}}\n" +
    "        <i class=\"icon-arrow-right3 size-24 right\"></i>\n" +
    "      </div>\n" +
    "      <div translate>Language</div>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "  <h4 ng-show=\"index.asset.isAsset === false\"></h4>\n" +
    "\n" +
    "  <ul class=\"no-bullet m0\" ng-show=\"index.asset.isAsset === false\">\n" +
    "    <li href ui-sref=preferencesUnit>\n" +
    "      <div class=\"right text-gray\">\n" +
    "        {{unitName}}\n" +
    "        <i class=\"icon-arrow-right3 size-24 right\"></i>\n" +
    "      </div>\n" +
    "      <div translate>Unit</div>\n" +
    "    </li>\n" +
    "\n" +
    "    <li href ui-sref=preferencesAltCurrency>\n" +
    "      <div class=\"right text-gray\">\n" +
    "        {{selectedAlternative.name}}\n" +
    "        <i class=\"icon-arrow-right3 size-24 right\"></i>\n" +
    "      </div>\n" +
    "      <div translate>Alternative Currency</div>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "  <h4 ng-show=\"index.asset.isAsset === false\"></h4>\n" +
    "\n" +
    "  <ul class=\"no-bullet m0\" ng-show=\"index.asset.isAsset === false\">\n" +
    "    <li href ui-sref=preferencesFee>\n" +
    "      <div class=\"right text-gray\">\n" +
    "        {{feeOpts[currentFeeLevel]|translate}}\n" +
    "        <i class=\"icon-arrow-right3 size-24 right\"></i>\n" +
    "      </div>\n" +
    "      <div translate>Bitcoin Network Fee Policy</div>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "\n" +
    "  <ion-toggle ng-model=spendUnconfirmed ng-show=\"index.asset.isAsset === false\" toggle-class=toggle-balanced ng-change=spendUnconfirmedChange()>\n" +
    "    <span class=toggle-label translate>Use Unconfirmed Funds</span>\n" +
    "  </ion-toggle>\n" +
    "\n" +
    "  <div ng-show=\"usePushNotifications && PNEnabledByUser\">\n" +
    "    <h4></h4>\n" +
    "    <ion-toggle ng-model=pushNotifications toggle-class=toggle-balanced ng-change=pushNotificationsChange()>\n" +
    "      <span class=toggle-label translate>Enable push notifications</span>\n" +
    "    </ion-toggle>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=m20t ng-show=\"usePushNotifications && !PNEnabledByUser && isIOSApp\">\n" +
    "    <div class=\"text-left text-gray size-12 m10\" translate>Push notifications for Copay are currently disabled. Enable them in the Settings app.</div>\n" +
    "    <ul class=\"no-bullet m0\" ng-click=openSettings()>\n" +
    "      <li ng-style=\"{'color':index.backgroundColor}\" translate>Open Settings app</li>\n" +
    "    </ul>\n" +
    "  </div>\n" +
    "\n" +
    "  <h4 ng-show=\"index.asset.isAsset === false\"></h4>\n" +
    "\n" +
    "  <ion-toggle ng-show=\"!index.isWindowsPhoneApp && index.asset.isAsset === false\" ng-model=glideraEnabled toggle-class=toggle-balanced ng-change=glideraChange()>\n" +
    "    <span class=toggle-label translate>Enable Glidera Service</span>\n" +
    "  </ion-toggle>\n" +
    "  <h4 ng-show=\"index.asset.isAsset === false\"></h4>\n" +
    "\n" +
    "  <ion-toggle ng-show=\"!index.isWindowsPhoneApp && index.asset.isAsset === false\" ng-model=coinbaseEnabled toggle-class=toggle-balanced ng-change=coinbaseChange()>\n" +
    "    <span class=toggle-label translate>Enable Coinbase Service</span>\n" +
    "  </ion-toggle>\n" +
    "  <h4></h4>\n" +
    "\n" +
    "  <ul class=\"no-bullet m0\">\n" +
    "    <li href ui-sref=about>\n" +
    "      <i class=\"icon-arrow-right3 size-24 right text-gray\"></i>\n" +
    "      <div translate>About Copay</div>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "  <h4></h4>\n" +
    "</div>\n" +
    "<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/preferencesHistory.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Transaction History'; goBackToState = 'preferencesAdvanced'\">\n" +
    "</div>\n" +
    "<div class=\"content preferences\" ng-controller=preferencesHistory>\n" +
    "  <h4></h4>\n" +
    "\n" +
    "  <ul class=\"no-bullet m0\" ng-init=\"index.updatingTxHistory ? null : csvHistory()\">\n" +
    "    <li ng-show=\"csvReady && !index.isCordova\" ng-csv=csvContent csv-header=csvHeader filename=\"Copay-{{index.alias || index.walletName}}.csv\">\n" +
    "      <span ng-style=\"{'color':index.backgroundColor}\" translate>\n" +
    "        Export to file\n" +
    "      </span>\n" +
    "    </li>\n" +
    "    <li ng-show=\"!csvReady && !index.isCordova\">\n" +
    "      <span class=\"right text-gray text-italic\" translate>preparing...</span>\n" +
    "      <span translate>Export to file</span>\n" +
    "    </li>\n" +
    "    <li ng-click=clearTransactionHistory() ng-style=\"{'color':index.backgroundColor}\" translate>\n" +
    "      Clear cache\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "</div>\n"
  );


  $templateCache.put('views/preferencesInformation.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Wallet Information'; goBackToState = 'preferencesAdvanced'\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=preferencesInformation ng-init=init()>\n" +
    "    <h4 class=\"title m0\" translate>Wallet Information</h4>\n" +
    "\n" +
    "    <ul class=\"no-bullet m0 size-14\">\n" +
    "      <li class=\"line-b p20 oh\" ng-if=androidTest>\n" +
    "        <span style=color:red translate>BETA: Android Key Derivation Test:</span>\n" +
    "        <span class=\"right text-gray\">\n" +
    "          {{androidTest}}\n" +
    "        </span>\n" +
    "      </li>\n" +
    "\n" +
    "      <li class=\"line-b p20 oh\" ng-click=saveBlack()>\n" +
    "        <span translate>Wallet Name (at creation)</span>\n" +
    "        <span class=\"right text-gray\">\n" +
    "          {{walletName}}\n" +
    "        </span>\n" +
    "      </li>\n" +
    "\n" +
    "      <li class=\"line-b p20 oh\" ng-click=copyToClipboard(walletId)>\n" +
    "        <span translate>Wallet Id</span>\n" +
    "        <span class=\"right text-gray enable_text_select\">\n" +
    "          {{walletId}}\n" +
    "        </span>\n" +
    "      </li>\n" +
    "\n" +
    "      <li class=\"line-b p20 oh\">\n" +
    "        <span translate>Wallet Configuration (m-n)</span>\n" +
    "        <span class=\"right text-gray\">\n" +
    "          {{M}}-{{N}}\n" +
    "        </span>\n" +
    "      </li>\n" +
    "\n" +
    "       <li class=\"line-b p20 oh\">\n" +
    "        <span translate>Wallet Network</span>\n" +
    "        <span class=\"right text-gray\">\n" +
    "          {{network}}\n" +
    "        </span>\n" +
    "      </li>\n" +
    "\n" +
    "      <li class=\"line-b p20 oh\">\n" +
    "        <span translate>Address Type</span>\n" +
    "        <span class=\"right text-gray\">\n" +
    "          {{addressType}}\n" +
    "        </span>\n" +
    "      </li>\n" +
    "\n" +
    "      <li class=\"line-b p20 oh\">\n" +
    "        <span translate>Derivation Strategy</span>\n" +
    "        <span class=\"right text-gray\">\n" +
    "          {{derivationStrategy}}\n" +
    "        </span>\n" +
    "      </li>\n" +
    "\n" +
    "      <li class=\"line-b p20 oh\" ng-show=index.externalSource>\n" +
    "        <span>Hardware Wallet</span>\n" +
    "        <span class=\"right text-gray capitalize\">\n" +
    "          {{index.externalSource}}\n" +
    "        </span>\n" +
    "      </li>\n" +
    "\n" +
    "      <li class=\"line-b p20 oh\" ng-show=\"!index.externalSource && !index.canSign\">\n" +
    "        <span translate></span>\n" +
    "        <span class=\"right text-gray capitalize\">\n" +
    "          No private key\n" +
    "        </span>\n" +
    "      </li>\n" +
    "\n" +
    "      <li class=\"line-b p20 oh\" ng-show=index.account>\n" +
    "        <span translate>Account</span> ({{derivationStrategy}})\n" +
    "        <span class=\"right text-gray\">\n" +
    "          #{{index.account}}\n" +
    "        </span>\n" +
    "      </li>\n" +
    "\n" +
    "      <h4 class=\"title m0\" translate>Copayers</h4>\n" +
    "      <li ng-repeat=\"copayer in index.copayers\">\n" +
    "        <span class=size-12 ng-show=\"copayer.id == index.copayerId\">\n" +
    "          <i class=\"icon-contact size-24 m10r\"></i> {{copayer.name}} ({{'Me'|translate}}) <i class=\"fi-check m5 right\"></i>\n" +
    "        </span>\n" +
    "        <span class=\"size-12 text-gray\" ng-show=\"copayer.id != index.copayerId\">\n" +
    "          <i class=\"icon-contact size-24 m10r\"></i> {{copayer.name}}<i class=\"fi-check m5 right\"></i>\n" +
    "        </span>\n" +
    "      </li>\n" +
    "\n" +
    "      <h4 class=\"title m0\" translate>Extended Public Keys</h4>\n" +
    "      <li ng-repeat=\"pk in pubKeys\" ng-click=copyToClipboard(pk)>\n" +
    "        <div class=\"row collapse\">\n" +
    "          <div class=\"small-4 columns\">Copayer {{$index}}</div>\n" +
    "          <div class=\"small-8 columns oh text-gray\">\n" +
    "            <div class=\"ellipsis enable_text_select\">{{pk}}</div>\n" +
    "            <div class=\"size-12 text-right\" ng-if=\"$index == 0\">\n" +
    "              ({{basePath}})\n" +
    "            </div>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "\n" +
    "    <div ng-show=addrs>\n" +
    "      <h4 class=\"title m0\" translate>Last Wallet Addresses</h4>\n" +
    "      <ul class=\"no-bullet m0\">\n" +
    "        <li ng-repeat=\"a in addrs\" class=oh ng-click=copyToClipboard(a.address)>\n" +
    "          <div class=\"enable_text_select ellipsis\">\n" +
    "            {{a.address}}\n" +
    "          </div>\n" +
    "          <div class=\"text-gray size-12 right enable_text_select\">\n" +
    "            {{a.path}} &middot;  {{a.createdOn *1000  | amDateFormat:'MMMM Do YYYY, h:mm a' }}\n" +
    "          </div>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "      <div class=\"text-centered text-gray size-12 m10\" translate>\n" +
    "        Only Main (not change) addresses are shown. The addresses on this list were not verified locally at this time.\n" +
    "      </div>\n" +
    "\n" +
    "      <ul class=\"no-bullet m0\">\n" +
    "        <li ng-style=\"{'color':index.backgroundColor}\" href ui-sref=walletHome ng-click=index.retryScan() translate>\n" +
    "          Scan addresses for funds\n" +
    "        </li>\n" +
    "        <li ng-style=\"{'color':index.backgroundColor}\" ng-show=index.isCordova ng-click=sendAddrs() translate>\n" +
    "          Send addresses by email\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <ul class=\"no-bullet m0 size-14\" ng-show=index.balanceByAddress>\n" +
    "      <div ng-if=index.balanceByAddress[0]>\n" +
    "        <h4 class=\"title m0\" translate>Balance By Address</h4>\n" +
    "        <li class=\"line-b p20 oh\" ng-repeat=\"a in index.balanceByAddress\" ng-click=copyToClipboard(a.address)>\n" +
    "          <div class=\"enable_text_select ellipsis\">\n" +
    "            {{a.address}}\n" +
    "          </div>\n" +
    "          <div class=\"text-gray text-right\">\n" +
    "            {{(a.amount/1e8).toFixed(8)}} BTC\n" +
    "          </div>\n" +
    "        </li>\n" +
    "      </div>\n" +
    "    </ul>\n" +
    "\n" +
    "    <h4></h4>\n" +
    "    <div class=extra-margin-bottom></div>\n" +
    "</div>\n"
  );


  $templateCache.put('views/preferencesLanguage.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Language'; goBackToState = 'preferencesGlobal'; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=preferencesLanguageController>\n" +
    "  <h4></h4>\n" +
    "\n" +
    "  <ion-radio class=\"line-b size-12 radio-label\" ng-repeat=\"lang in availableLanguages\" ng-value=lang.isoCode ng-model=currentLanguage ng-click=save(lang.isoCode)>{{lang.name}}\n" +
    "  </ion-radio>\n" +
    "  \n" +
    "  <div class=\"row m20v\">\n" +
    "    <div class=\"columns text-center\">\n" +
    "      <p class=\"size-12 text-black\">\n" +
    "        <span translate>All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at</span> \n" +
    "        <a ng-click=\"$root.openExternalLink('https://crowdin.com/project/copay', '_system')\">https://crowdin.com/project/copay</a>.\n" +
    "      </p>\n" +
    "      <span class=\"size-12 text-gray\" translate>\n" +
    "        Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.\n" +
    "      </span>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('views/preferencesLogs.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Session log'; goBackToState = 'about'; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=\"preferencesLogs as logs\">\n" +
    "  <h4></h4>\n" +
    "\n" +
    "  <div class=\"row columns large-centered medium-centered\">\n" +
    "  <button class=\"black round small expand\" ng-show=index.isCordova ng-style=\"{'background-color':index.backgroundColor}\" ng-click=logs.sendLogs()><i class=fi-mail></i>\n" +
    "      \n" +
    "  <span translate>Send by email</span>\n" +
    "  </button>\n" +
    "\n" +
    "  <ul class=\"no-bullet size-14 oh\" style=\"word-wrap: break-word\">\n" +
    "    <li class=\"line-b enable_text_select\" ng-repeat=\"l in logs.logs\">\n" +
    "\n" +
    "      <span ng-class=\"{'text-warning': l.level=='warn', 'text-secondary': l.level=='debug', 'text-primary': l.level=='info', 'text-alert': l.level=='error' }\"> \n" +
    "      {{l.msg}}\n" +
    "      </span>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "  </div>\n" +
    "</div>\n"
  );


  $templateCache.put('views/preferencesUnit.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Unit'; goBackToState = 'preferencesGlobal'; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=preferencesUnitController>\n" +
    "  <h4></h4>\n" +
    "\n" +
    "  <ion-radio class=\"line-b size-12 radio-label\" ng-repeat=\"unit in unitList\" ng-value=unit.code ng-model=currentUnit ng-click=save(unit)>{{unit.shortName}}\n" +
    "  </ion-radio>\n" +
    "</div>\n"
  );


  $templateCache.put('views/sellCoinbase.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Sell'; goBackToState = 'coinbase'; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<div class=\"content coinbase\" ng-controller=\"sellCoinbaseController as sell\">\n" +
    "\n" +
    "  <div class=\"row m20t\" ng-show=\"sell.error || index.coinbaseError\" ng-click=\"sell.error = null\">\n" +
    "    <div class=columns>\n" +
    "      <div class=box-notification>\n" +
    "        <ul class=\"no-bullet m0 size-12 text-warning\">\n" +
    "          <li ng-repeat=\"err in (sell.error.errors || index.coinbaseError.errors)\" ng-bind-html=err.message></li>\n" +
    "        </ul>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"row m20ti\" ng-show=\"index.coinbaseAccount && !sell.sellInfo && !sell.sendInfo\">\n" +
    "    <div class=columns>\n" +
    "      <form name=sellCoinbaseForm ng-submit=\"sell.depositFunds(index.coinbaseToken, index.coinbaseAccount)\" novalidate>\n" +
    "\n" +
    "\n" +
    "        <div ng-show=!showPriceSensitivity>\n" +
    "\n" +
    "          <div ng-if=index.coinbaseToken ng-init=sell.init(index.coinbaseTestnet) ng-click=openWalletsModal(sell.allWallets)>\n" +
    "            <label>Copay Wallet</label>\n" +
    "            <div class=input>\n" +
    "              <input id=address name=address ng-disabled=sell.selectedWalletId ng-attr-placeholder=\"{{'Choose your source wallet'}}\" ng-model=sell.selectedWalletName required>\n" +
    "              <a class=\"postfix size-12 m0 text-gray\">\n" +
    "                <i class=\"icon-wallet size-18\"></i>\n" +
    "              </a>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "\n" +
    "          <label>\n" +
    "            Amount\n" +
    "            <span ng-if=index.coinbaseToken ng-init=sell.getPrice(index.coinbaseToken) ng-show=sell.sellPrice class=\"size-11 text-light right\">\n" +
    "              1 BTC <i class=icon-arrow-right></i> {{sell.sellPrice.amount}} {{sell.sellPrice.currency}}\n" +
    "            </span>\n" +
    "          </label>\n" +
    "          <div class=input>\n" +
    "            <input ng-show=!showAlternative type=number id=amount ignore-mouse-wheel name=amount ng-attr-placeholder=\"{{'Amount in ' + (showAlternative ? 'USD' : 'BTC')}}\" ng-minlength=0.00000001 ng-maxlength=10000000000 ng-model=amount autocomplete=off>\n" +
    "\n" +
    "            <input ng-show=showAlternative type=number id=fiat ignore-mouse-wheel name=fiat ng-attr-placeholder=\"{{'Amount in ' + (showAlternative ? 'USD' : 'BTC')}}\" ng-model=fiat autocomplete=off>\n" +
    "\n" +
    "            <a ng-show=!showAlternative class=\"postfix button\" ng-click=\"showAlternative = true; amount = null\">BTC</a>\n" +
    "            <a ng-show=showAlternative class=\"postfix button black\" ng-click=\"showAlternative = false; fiat = null\">USD</a>\n" +
    "          </div>\n" +
    "\n" +
    "          <div class=\"text-center text-gray size-12 m10b\">\n" +
    "            <span ng-show=\"!(amount || fiat)\">\n" +
    "              Enter the amount to get the exchange rate\n" +
    "            </span>\n" +
    "            <span ng-show=\"!sell.sellPrice && (amount || fiat)\">\n" +
    "              Not available\n" +
    "            </span>\n" +
    "            <span ng-show=\"sell.sellPrice && amount && !fiat\">\n" +
    "              ~ {{sell.sellPrice.amount * amount | currency : 'USD ' : 2}}\n" +
    "            </span>\n" +
    "          </div>\n" +
    "\n" +
    "          <div class=text-center>\n" +
    "            <i class=\"db fi-arrow-down size-24 m10v\"></i>\n" +
    "          </div>\n" +
    "\n" +
    "          <div ng-if=index.coinbaseToken ng-init=sell.getPaymentMethods(index.coinbaseToken)>\n" +
    "            <label>Deposit into</label>\n" +
    "            <select ng-model=selectedPaymentMethod.id ng-options=\"item.id as item.name for item in sell.paymentMethods\">\n" +
    "            </select>\n" +
    "          </div>\n" +
    "          <div class=\"input m20t\">\n" +
    "            <a href class=\"button black expand round\" ng-disabled=\" (!amount && !fiat) || !sell.sellPrice.amount\" ng-style=\"{'background-color': '#2b71b1'}\" ng-click=\"showPriceSensitivity = true\">Continue</a>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div ng-show=showPriceSensitivity>\n" +
    "          <h1>Price Sensitivity</h1>\n" +
    "          <p class=\"size-14 text-gray\">\n" +
    "            Coinbase has not yet implemented an immediate method to sell bitcoin from a wallet. To make this sale, funds\n" +
    "            will be sent to your Coinbase account, and sold when Coinbase accepts the transaction (usually one\n" +
    "            hour).\n" +
    "          </p>\n" +
    "          <label>At what percentage lower price would you accept to sell?</label>\n" +
    "          <select ng-model=selectedPriceSensitivity ng-options=\"item as item.name for item in priceSensitivity track by item.value\">\n" +
    "          </select>\n" +
    "          <p class=\"size-12 text-gray\">\n" +
    "          Estimated sale value: {{sell.sellPrice.amount * amount | currency : 'USD ' : 2}} <br>\n" +
    "          Still sell if price fall until:\n" +
    "          {{(sell.sellPrice.amount - (selectedPriceSensitivity.value / 100) * sell.sellPrice.amount) * amount | currency : 'USD ' : 2}}\n" +
    "          </p>\n" +
    "\n" +
    "          <div class=\"input m20t row\">\n" +
    "            <div class=\"columns large-6 medium-6 small-6\">\n" +
    "              <a href class=\"button outline dark-gray expand round\" ng-click=\"showPriceSensitivity = false\">Back</a>\n" +
    "            </div>\n" +
    "            <div class=\"columns large-6 medium-6 small-6\">\n" +
    "            <input class=\"button black expand round\" ng-disabled=\"(!amount && !fiat) || !sell.sellPrice.amount\" ng-style=\"{'background-color': '#2b71b1'}\" type=submit value=Confirm>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </form>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"m20ti row\" ng-show=\"sell.sendInfo && !sell.sellInfo && !sell.success\">\n" +
    "    <div class=columns>\n" +
    "      <h1>Funds sent to Coinbase Account</h1>\n" +
    "      <p class=\"size-12 text-gray\">\n" +
    "        The transaction is not yet confirmed, and will show as \"Processing\" in your Activity. The bitcoin sale will be completed automatically once it is confirmed by Coinbase.\n" +
    "      </p>\n" +
    "      <button class=\"m20t outline black round expand\" ng-style=\"{'background-color': '#2b71b1'}\" ng-click=\"$root.go('coinbase')\">OK</button>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div ng-show=\"sell.sellInfo && !sell.sendInfo && !sell.success\">\n" +
    "    <h4 class=title>Confirm transaction</h4>\n" +
    "\n" +
    "    <ul class=\"no-bullet m10t size-12 white\">\n" +
    "      <li class=\"line-b line-t p15\">\n" +
    "        <span class=\"m10 text-normal text-bold\">Amount</span>\n" +
    "        <span class=\"right text-gray\">{{sell.sellInfo.amount.amount}} {{sell.sellInfo.amount.currency}}</span>\n" +
    "      </li>\n" +
    "      <li class=\"line-b oh p15\">\n" +
    "        <span class=\"m10 text-normal text-bold\">Fees</span>\n" +
    "        <span class=\"right text-gray\">\n" +
    "          <div ng-repeat=\"fee in sell.sellInfo.fees\">\n" +
    "            <b>{{fee.type}}</b> {{fee.amount.amount}} {{fee.amount.currency}}\n" +
    "          </div>\n" +
    "        </span>\n" +
    "      </li>\n" +
    "      <li class=\"line-b p15\">\n" +
    "        <span class=\"m10 text-normal text-bold\">Subtotal</span>\n" +
    "        <span class=\"right text-gray\">{{sell.sellInfo.subtotal.amount}} {{sell.sellInfo.subtotal.currency}}</span>\n" +
    "      </li>\n" +
    "      <li class=\"line-b p15\">\n" +
    "        <span class=\"m10 text-normal text-bold\">Total</span>\n" +
    "        <span class=\"right text-gray\">{{sell.sellInfo.total.amount}} {{sell.sellInfo.total.currency}}</span>\n" +
    "      </li>\n" +
    "      <li class=\"line-b p15\">\n" +
    "        <span class=\"m10 text-normal text-bold\">Payout at</span>\n" +
    "        <span class=\"right text-gray\">{{sell.sellInfo.payout_at | amCalendar}}</span>\n" +
    "      </li>\n" +
    "    </ul>\n" +
    "    <div class=row>\n" +
    "      <div class=columns>\n" +
    "        <button class=\"button black round expand\" ng-style=\"{'background-color': '#2b71b1'}\" ng-click=\"sell.confirmSell(index.coinbaseToken, index.coinbaseAccount, sell.sellInfo)\">\n" +
    "          Sell\n" +
    "        </button>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <div class=\"m20t row text-center\" ng-show=sell.success>\n" +
    "    <div class=columns>\n" +
    "      <h1>Sale initiated</h1>\n" +
    "      <p class=text-gray>\n" +
    "      A transfer has been initiated to your bank account and should arrive at {{sell.success.payout_at | amCalendar}}.\n" +
    "      </p>\n" +
    "\n" +
    "      <button class=\"outline dark-gray round expand\" ng-click=\"$root.go('coinbase')\">OK</button>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "</div>\n" +
    "<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/sellGlidera.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Sell'; goBackToState = 'glidera'; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<div class=\"content glidera\" ng-controller=\"sellGlideraController as sell\">\n" +
    "\n" +
    "  <div ng-show=\"index.glideraLimits && !sell.show2faCodeInput && !sell.success\">\n" +
    "    <h4 class=\"title m0 text-left\">\n" +
    "      <span class=text-light>Daily sell limit</span>:\n" +
    "      {{index.glideraLimits.dailySell|currency:'':2}} {{index.glideraLimits.currency}}\n" +
    "      (remaining {{index.glideraLimits.dailySellRemaining|currency:'':2}} {{index.glideraLimits.currency}})\n" +
    "      <br>\n" +
    "      <span class=text-light>Monthly sell limit</span>:\n" +
    "      {{index.glideraLimits.monthlySell|currency:'':2}} {{index.glideraLimits.currency}}\n" +
    "      (remaining {{index.glideraLimits.monthlySellRemaining|currency:'':2}} {{index.glideraLimits.currency}})\n" +
    "    </h4>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"row m20t\">\n" +
    "    <div class=columns>\n" +
    "\n" +
    "      <div class=\"box-notification m20b\" ng-show=index.glideraLimits.transactDisabledPendingFirstTransaction>\n" +
    "        <span class=text-warning>\n" +
    "          This operation was disabled because you have a pending first transaction\n" +
    "        </span>\n" +
    "      </div>\n" +
    "\n" +
    "      <div ng-show=\"!sell.show2faCodeInput && !sell.success\">\n" +
    "        <form name=sellPriceForm ng-submit=sell.get2faCode(index.glideraToken) novalidate>\n" +
    "\n" +
    "          <div ng-if=index.glideraToken ng-init=sell.init(index.glideraTestnet) ng-click=openWalletsModal(sell.allWallets)>\n" +
    "            <label>Wallet</label>\n" +
    "            <div class=input>\n" +
    "              <input id=address name=address ng-disabled=sell.selectedWalletId ng-attr-placeholder=\"{{'Choose your source wallet'}}\" ng-model=sell.selectedWalletName required>\n" +
    "              <a class=\"postfix size-12 m0 text-gray\">\n" +
    "                <i class=\"icon-wallet size-18\"></i>\n" +
    "              </a>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "\n" +
    "          <label><span>Amount in</span> {{showAlternative ? 'USD' : 'BTC'}}</label>\n" +
    "          <div class=input>\n" +
    "            <input ng-show=!showAlternative type=number id=qty ignore-mouse-wheel name=qty ng-attr-placeholder=\"{{'Amount'}}\" ng-minlength=0.00000001 ng-maxlength=10000000000 ng-model=qty autocomplete=off ng-change=\"sell.getSellPrice(index.glideraToken, {'qty': qty})\">\n" +
    "\n" +
    "            <input ng-show=showAlternative type=number id=fiat ignore-mouse-wheel name=fiat ng-attr-placeholder=\"{{'Amount'}}\" ng-model=fiat autocomplete=off ng-change=\"sell.getSellPrice(index.glideraToken, {'fiat': fiat})\">\n" +
    "\n" +
    "            <a ng-show=!showAlternative class=postfix ng-click=\"showAlternative = true; qty = null; sell.sellPrice = null\">BTC</a>\n" +
    "            <a ng-show=showAlternative class=postfix ng-click=\"showAlternative = false; fiat = null; sell.sellPrice = null\">USD</a>\n" +
    "\n" +
    "            <div class=\"text-center text-gray size-12 m20b\" ng-show=\"!sell.gettingSellPrice && sell.sellPrice.qty\">\n" +
    "              Sell\n" +
    "              <span ng-show=qty>{{sell.sellPrice.subtotal|currency:'':2}} {{sell.sellPrice.currency}} in Bitcoin</span>\n" +
    "              <span ng-show=fiat>{{sell.sellPrice.qty}} BTC</span>\n" +
    "              at {{sell.sellPrice.price|currency:'':2}} {{sell.sellPrice.currency}}/BTC\n" +
    "\n" +
    "            </div>\n" +
    "            <div class=\"text-center text-gray size-12 m20b\" ng-show=\"!sell.gettingSellPrice && !sell.sellPrice.qty\">\n" +
    "              (Enter the amount to get the exchange rate)\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"text-center text-gray size-12 m20b\" ng-show=sell.gettingSellPrice>\n" +
    "              ...\n" +
    "            </div>\n" +
    "\n" +
    "            <input class=\"button black expand round\" ng-style=\"{'background-color':index.backgroundColor}\" type=submit value=\"{{'Continue'}}\" ng-disabled=\"index.glideraLimits.transactDisabledPendingFirstTransaction || !sell.sellPrice.qty ||\n" +
    "            !sell.selectedWalletId \">\n" +
    "          </div>\n" +
    "        </form>\n" +
    "      </div>\n" +
    "      <div ng-show=\"sell.show2faCodeInput && !sell.success\">\n" +
    "        <div class=\"m10t text-center\">\n" +
    "{{sell.sellPrice.qty}} BTC &rarr; {{sell.sellPrice.subtotal|currency:'':2}} {{sell.sellPrice.currency}}\n" +
    "          <p class=m20t>\n" +
    "            A SMS containing a confirmation code was sent to your phone. <br>\n" +
    "            Please, enter the code below\n" +
    "          </p>\n" +
    "          <form name=sellForm ng-submit=\"sell.createTx(index.glideraToken, index.glideraPermissions, twoFaCode)\" novalidate>\n" +
    "              <input type=number ng-model=twoFaCode required ignore-mouse-wheel>\n" +
    "              <input class=\"button black expand round\" ng-style=\"{'background-color':index.backgroundColor}\" type=submit value=\"{{'Sell'}}\" ng-disabled=\"sellForm.$invalid \">\n" +
    "          </form>\n" +
    "          <p class=\"m10t size-12 text-gray\">\n" +
    "          Bitcoins will be immediately sent from your wallet to Glidera. Fiat will be deposited in your bank account in 4-6 business days.\n" +
    "          </p>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div class=box-notification ng-show=\"sell.error && !sell.success\">\n" +
    "        <span class=\"text-warning size-14\">\n" +
    "          {{sell.error}}\n" +
    "        </span>\n" +
    "      </div>\n" +
    "      <div class=text-center ng-show=sell.success>\n" +
    "        <h1>Sale initiated</h1>\n" +
    "        <p class=text-gray>\n" +
    "        A transfer has been initiated to your bank account and should arrive in 4-6 business days.\n" +
    "        </p>\n" +
    "\n" +
    "        <button class=\"outline dark-gray round expand\" ng-click=\"$root.go('glidera')\">OK</button>\n" +
    "      </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "<div class=extra-margin-bottom></div>\n" +
    "</div>"
  );


  $templateCache.put('views/termOfUse.html',
    "	<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Terms of Use'; goBackToState = 'about'; noColor = true\">\n" +
    "	</div>\n" +
    "	<div ng-controller=termOfUseController class=content>\n" +
    "		<p class=\"enable_text_select m0\">\n" +
    "			</p><div class=terms ng-include=\"'views/includes/terms.html'\"></div>\n" +
    "		<p></p>\n" +
    "		<div class=\"row text-center\">\n" +
    "			<p ng-show=\"lang != 'en'\">\n" +
    "				<a class=center ng-click=\"$root.openExternalLink('https://copay.io/disclaimer')\" translate>Official English Disclaimer</a>\n" +
    "			</p>\n" +
    "		</div>\n" +
    "	</div>\n" +
    "	<div class=extra-margin-bottom></div>\n"
  );


  $templateCache.put('views/translators.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Translators'; goBackToState = 'about'; noColor = true\">\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"content preferences\">\n" +
    "  <h4 class=\"title m0\" translate>Translation Credits</h4>\n" +
    "  <ul class=\"no-bullet m0 size-14\">\n" +
    "    <li class=\"line-b p10\">kinoshitajona<span class=\"right text-gray size-12\" translate>Japanese</span></li>\n" +
    "    <li class=\"line-b p10\">Kirvx<span class=\"right text-gray size-12\" translate>French</span></li>\n" +
    "    <li class=\"line-b p10\">saschad<span class=\"right text-gray size-12\" translate>German</span></li>\n" +
    "    <li class=\"line-b p10\">cmgustavo83<span class=\"right text-gray size-12\" translate>Spanish</span></li>\n" +
    "    <li class=\"line-b p10\">RussianNeuroMancer<span class=\"right text-gray size-12\" translate>Russian</span></li>\n" +
    "    <li class=\"line-b p10\">HostFat<span class=\"right text-gray size-12\" translate>Italian</span></li>\n" +
    "    <li class=\"line-b p10\">xm2hi<span class=\"right text-gray size-12\" translate>Chinese</span></li>\n" +
    "    <li class=\"line-b p10\">Pirx1618<span class=\"right text-gray size-12\" translate>Polish</span></li>\n" +
    "    <li class=\"line-b p10\">mareksip<span class=\"right text-gray size-12\" translate>Czech</span></li>\n" +
    "  </ul>\n" +
    "  <div class=\"row m20t\">\n" +
    "    <div class=\"columns text-center\">\n" +
    "      <p class=\"size-12 text-black\">\n" +
    "        <span translate>All contributions to Copay's translation are welcome. Sign up at crowdin.com and join the Copay project at</span> \n" +
    "        <a ng-click=\"$root.openExternalLink('https://crowdin.com/project/copay', '_system')\">https://crowdin.com/project/copay</a>.\n" +
    "      </p>\n" +
    "      <span class=\"size-12 text-gray\" translate>\n" +
    "        Don't see your language on Crowdin? Contact the Owner on Crowdin! We'd love to support your language.\n" +
    "      </span>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <div class=extra-margin-bottom></div>\n" +
    "</div>\n"
  );


  $templateCache.put('views/unsupported.html',
    "<div class=\"row columns p20\">\n" +
    "  <div class=text-center>\n" +
    "    <logo width=146></logo>\n" +
    "    <div class=text-white ng-include=\"'views/includes/version.html'\"></div>\n" +
    "  </div>\n" +
    "  <h1 translate class=text-center>Browser unsupported</h1>\n" +
    "  <h3 class=text-center>\n" +
    "    Sorry, ColuWallet is not supported by your browser. \n" +
    "    Please use a current version of Google Chrome, Mozilla Firefox, Internet Explorer, Safari, or Opera.\n" +
    "    <br>\n" +
    "    Note that localStorage should also be enabled (enabled by default in most cases).\n" +
    "  </h3>\n" +
    "</div>\n"
  );


  $templateCache.put('views/uri.html',
    "\n" +
    "<div class=\"row columns p20\" ng-controller=uriController>\n" +
    "  <div class=text-center>\n" +
    "    <logo width=146></logo>\n" +
    "    <div class=text-white ng-include=\"'views/includes/version.html'\"></div>\n" +
    "  </div>\n" +
    "  <h3 class=text-center translate>\n" +
    "    Please wait to be redirected...\n" +
    "  </h3>\n" +
    "</div>\n" +
    "\n"
  );


  $templateCache.put('views/walletHome.html',
    "\n" +
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"showPreferences = true\" ng-show=!index.noFocusedWallet>\n" +
    "</div>\n" +
    "\n" +
    "<div ng-controller=\"walletHomeController as home\">\n" +
    "  <div class=\"row columns m30tp\" ng-show=index.noFocusedWallet>\n" +
    "    <div class=\"text-center size-12 text-warning m20b\">\n" +
    "      <i class=fi-alert></i> <span translate>You do not have any wallet</span>\n" +
    "    </div>\n" +
    "    <button class=\"button black round expand\" href ui-sref=add translate>Create</button>\n" +
    "  </div>\n" +
    "\n" +
    " <div class=onGoingProcess ng-show=index.updating>\n" +
    "     <div class=onGoingProcess-content ng-style=\"{'background-color':index.backgroundColor}\">\n" +
    "      <div class=spinner>\n" +
    "        <div class=rect1></div>\n" +
    "        <div class=rect2></div>\n" +
    "        <div class=rect3></div>\n" +
    "        <div class=rect4></div>\n" +
    "        <div class=rect5></div>\n" +
    "      </div>\n" +
    "       <span translate>{{index.ongoingProcess || 'Updating Wallet'}}...</span>\n" +
    "     </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=oh ng-show=!index.noFocusedWallet>\n" +
    "\n" +
    "    \n" +
    "\n" +
    "    <div id=walletHome class=\"walletHome tab-view tab-in\">\n" +
    "      <ion-content on-release=\"index.allowPullToRefresh = true;\" on-drag-right=index.allowRefresher() delegate-handle=my-handle overflow-scroll=true>\n" +
    "        <ion-refresher ng-if=\"index.allowPullToRefresh && index.isCordova\" pulling-icon=ion-ios-refresh spinner=ios-small on-refresh=\"index.updateAll({triggerTxUpdate: true})\">\n" +
    "        </ion-refresher>\n" +
    "        <div class=\"oh pr\">\n" +
    "          <div ng-style=\"{'background-color':index.backgroundColor}\" class=amount>\n" +
    "            <div ng-if=\"!index.notAuthorized && !index.updating\">\n" +
    "              <div class=m15t ng-show=index.updateError ng-click=\"index.updateAll({triggerTxUpdate: true})\">\n" +
    "                <span class=\"size-12 db m10b\">{{index.updateError|translate}}</span>\n" +
    "                <button class=\"outline white tiny round\" translate>Tap to retry</button>\n" +
    "              </div>\n" +
    "\n" +
    "              <div ng-show=\"index.walletScanStatus == 'error'\" ng-click=index.retryScan()>\n" +
    "                <span translate>Scan status finished with error</span>\n" +
    "                <br><span translate>Tap to retry</span>\n" +
    "              </div>\n" +
    "\n" +
    "              <div ng-click=\"index.updateAll({triggerTxUpdate: true})\" ng-show=\"index.asset.assetId && !index.updateError && index.walletScanStatus != 'error' && !index.shouldHideBalance\" on-hold=index.onHold()>\n" +
    "                <strong class=size-36 ng-if=index.asset.isAsset>{{index.asset.balanceStr|rawHtml}}</strong>\n" +
    "                <strong class=size-36 ng-show=!index.asset.isAsset>{{index.totalBalanceStr}}</strong>\n" +
    "                <div class=size-14 ng-if=\"index.totalBalanceAlternative && !index.asset.isAsset\">{{index.totalBalanceAlternative}} {{index.alternativeIsoCode}}</div>\n" +
    "                <div class=size-14 ng-if=index.pendingAmount>\n" +
    "                  <span translate>Pending Confirmation</span>: {{index.pendingAmountStr}}\n" +
    "                </div>\n" +
    "              </div>\n" +
    "\n" +
    "              <div ng-show=\"!index.updateError && index.walletScanStatus != 'error' && index.shouldHideBalance\" on-hold=index.onHold()>\n" +
    "                <strong class=size-24 translate>[Balance Hidden]</strong>\n" +
    "                <div class=size-14 translate>\n" +
    "                  Tap and hold to show\n" +
    "                </div>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "           <div ng-if=index.updating>\n" +
    "               <div class=size-36>\n" +
    "                 <strong>...</strong>\n" +
    "               </div>\n" +
    "             </div>\n" +
    "          </div> \n" +
    "\n" +
    "          <div class=wallet-info>\n" +
    "            <span ng-include=\"'views/includes/walletInfo.html'\"></span>\n" +
    "          </div>\n" +
    "          <div class=camera-icon ng-show=index.isComplete>\n" +
    "            <qr-scanner on-scan=home.onQrCodeScanned(data)></qr-scanner>\n" +
    "          </div>\n" +
    "        </div> \n" +
    "\n" +
    "        <div class=p60b>\n" +
    "          <div class=\"oh pr m20t\" ng-show=index.incorrectDerivation>\n" +
    "            <div class=\"text-center text-warning\">\n" +
    "              <i class=fi-alert></i>\n" +
    "              <span translate>\n" +
    "                WARNING: Key derivation is not working on this device/wallet. Actions cannot be performed on this wallet.\n" +
    "              </span>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "          <div class=\"oh pr m20t\" ng-show=\"index.notAuthorized && !index.updating\">\n" +
    "            <div class=\"text-center text-warning\">\n" +
    "              <i class=fi-alert></i>\n" +
    "              <span translate>\n" +
    "                WARNING: Wallet not registered\n" +
    "              </span>\n" +
    "            </div>\n" +
    "            <div class=\"text-center text-gray m15r m15l\" translate>\n" +
    "              This wallet is not registered at the given Bitcore Wallet Service (BWS). You can recreate it from the local information.\n" +
    "            </div>\n" +
    "            <div class=\"text-center m10t\">\n" +
    "              <span class=\"button outline round dark-gray tiny\" ng-click=index.recreate()>\n" +
    "                <span translate>Recreate</span>\n" +
    "              </span>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "\n" +
    "          <div class=\"release size-12\" ng-show=newRelease ng-click=\"$root.openExternalLink('https://github.com/bitpay/copay/releases/latest')\">\n" +
    "            <span>{{newRelease}}</span><i class=\"icon-arrow-right3 right size-18\"></i>\n" +
    "          </div>\n" +
    "\n" +
    "          <div ng-if=\"index.txps[0] && index.asset.assetId\">\n" +
    "            <h4 ng-show=index.requiresMultipleSignatures class=\"title m0\" translate>Payment Proposals</h4>\n" +
    "            <h4 ng-show=!index.requiresMultipleSignatures class=\"title m0\" translate>Unsent transactions</h4>\n" +
    "            <div ng-repeat=\"tx in index.txps\">\n" +
    "              <div ng-include=index.txTemplateUrl></div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"text-gray text-center size-12 p10t\" ng-show=\"index.lockedBalanceSat && !index.asset.isAsset\">\n" +
    "              <span translate>Total Locked Balance</span>:\n" +
    "              <b>{{index.lockedBalanceStr}} </b>\n" +
    "              <span> {{index.lockedBalanceAlternative}}\n" +
    "                {{index.alternativeIsoCode}} </span>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "\n" +
    "          \n" +
    "\n" +
    "          <h4 class=title ng-click=\"index.startSearch(); openSearchModal()\" ng-show=!index.notAuthorized>\n" +
    "            <span translate>Activity</span>\n" +
    "            <i class=\"dib m5l size-16 pointer fi-magnifying-glass\"></i>\n" +
    "          </h4>\n" +
    "\n" +
    "          <div class=\"oh pr m20t text-gray size-12 text-center\" ng-show=\"!index.loadingWallet && !index.txHistory[0] && !index.updatingTxHistory && !index.txHistoryError && !index.updateError && !index.notAuthorized && index.asset.assetId\" translate>No transactions yet\n" +
    "          </div>\n" +
    "\n" +
    "          <div class=\"oh pr\" ng-show=\"(index.txHistory[0] || index.txProgress > 5) && !index.notAuthorized && index.asset.assetId\">\n" +
    "\n" +
    "            <div ng-show=\"index.updatingTxHistory && index.txProgress > 5\">\n" +
    "              <div class=\"row p20 text-center\">\n" +
    "                <div class=\"columns large-12 medium-12 small-12 m10b\">\n" +
    "                  <ion-spinner class=spinner-dark icon=lines></ion-spinner>\n" +
    "                </div>\n" +
    "                <div class=\"size-12 text-gray m20t\">\n" +
    "                  <div translate>{{index.txProgress}} transactions downloaded</div>\n" +
    "                  <div translate>Updating transaction history. Please stand by.</div>\n" +
    "                </div>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-if=\"index.txHistory[0] &&  index.updatingTxHistory && index.newTx\" class=\"row collapse last-transactions-content animated fadeInDown\">\n" +
    "              <div class=\"large-6 medium-6 small-6 columns size-14\">\n" +
    "                <div class=\"m10r left\">\n" +
    "                  <img src=img/icon-new.svg width=40>\n" +
    "                </div>\n" +
    "                <div class=m10t style=\"background:#eee; width: 8em; margin-left: 52px; line-height:0.6em\">\n" +
    "                  <span>&nbsp;</span>\n" +
    "                </div>\n" +
    "                <div style=\"margin-top:5px; background:#eee; width: 6em; margin-left: 52px; line-height:0.6em\">\n" +
    "                  <span>&nbsp;</span>\n" +
    "                </div>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div ng-repeat=\"btx in index.txHistory track by btx.txid\" ng-click=home.openTxModal(btx) class=\"row collapse last-transactions-content\">\n" +
    "              <div class=\"large-6 medium-6 small-6 columns size-14\">\n" +
    "                <div class=\"m10r left\">\n" +
    "                  <img src=img/icon-receive-history.svg alt=sync width=40 ng-show=\"btx.action == 'received'\">\n" +
    "                  <img src=img/icon-sent-history.svg alt=sync width=40 ng-show=\"btx.action == 'sent'\">\n" +
    "                  <img src=img/icon-moved.svg alt=sync width=40 ng-show=\"btx.action == 'moved'\">\n" +
    "                </div>\n" +
    "                <div class=m10t>\n" +
    "                  <span ng-show=\"btx.action == 'received'\">\n" +
    "                    <span class=ellipsis>\n" +
    "                      <span ng-if=btx.note.body>{{btx.note.body}}</span>\n" +
    "                      <span ng-if=!btx.note.body translate> Received</span>\n" +
    "                    </span>\n" +
    "                  </span>\n" +
    "                  <span ng-show=\"btx.action == 'sent'\">\n" +
    "                    <span class=ellipsis>\n" +
    "                      <span ng-if=btx.message>{{btx.message}}</span>\n" +
    "                      <span ng-if=\"!btx.message && btx.note.body\">{{btx.note.body}}</span>\n" +
    "                      <span ng-if=\"!btx.message && !btx.note.body && index.addressbook[btx.addressTo]\">{{index.addressbook[btx.addressTo]}}</span>\n" +
    "                      <span ng-if=\"!btx.message && !btx.note.body && !index.addressbook[btx.addressTo]\" translate> Sent</span>\n" +
    "                    </span>\n" +
    "                  </span>\n" +
    "                  <span ng-show=\"btx.action == 'moved'\">\n" +
    "                    <span class=ellipsis>\n" +
    "                      <span ng-if=btx.note.body>{{btx.note.body}}</span>\n" +
    "                      <span ng-if=!btx.note.body translate>Moved</span>\n" +
    "                    </span>\n" +
    "\n" +
    "                  </span>\n" +
    "                  <span class=\"label tu warning radius\" ng-show=\"btx.action == 'invalid'\" translate>Invalid</span>\n" +
    "                </div>\n" +
    "              </div>\n" +
    "\n" +
    "              <div class=\"large-5 medium-5 small-5 columns text-right\">\n" +
    "                <span class=size-16 ng-class=\"{'text-bold': btx.recent}\">\n" +
    "                  <span ng-if=\"btx.action == 'received'\">+</span>\n" +
    "                  <span ng-if=\"btx.action == 'sent'\">-</span>\n" +
    "                  <span class=size-12 ng-if=\"btx.action == 'invalid'\" translate>\n" +
    "                  (possible double spend)\n" +
    "                  </span>\n" +
    "                  <span ng-if=\"btx.action != 'invalid'\">\n" +
    "                  {{btx.amountStr}}\n" +
    "                  </span>\n" +
    "                </span>\n" +
    "                <div class=\"size-12 text-gray\">\n" +
    "                  <time ng-if=btx.time>{{btx.time * 1000 | amTimeAgo}}</time>\n" +
    "                  <span translate class=text-warning ng-show=\"!btx.time && (!btx.confirmations || btx.confirmations == 0)\">\n" +
    "                    Unconfirmed\n" +
    "                  </span>\n" +
    "                </div>\n" +
    "              </div>\n" +
    "              <div class=\"large-1 medium-1 small-1 columns text-right m10t\">\n" +
    "                <i class=\"icon-arrow-right3 size-18\"></i>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"row m20t text-center\" ng-show=\"index.historyRendering && !index.ching\">\n" +
    "              <div class=\"columns large-12 medium-12 small-12\">\n" +
    "                <ion-spinner class=spinner-stable icon=lines></ion-spinner>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <ion-infinite-scroll ng-if=index.historyShowMore on-infinite=index.showMore() distance=1%>\n" +
    "            </ion-infinite-scroll>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "\n" +
    "      </ion-content>\n" +
    "      <div class=extra-margin-bottom></div>\n" +
    "    </div> \n" +
    "\n" +
    "    \n" +
    "    <div id=receive class=\"receive tab-view\">\n" +
    "\n" +
    "      <div ng-show=index.needsBackup class=\"p60t columns text-center\">\n" +
    "        <div class=circle-icon>\n" +
    "          <i class=\"fi-alert size-48\"></i>\n" +
    "        </div>\n" +
    "        <h5 translate>Backup Needed</h5>\n" +
    "        <p class=\"text-gray m20b columns\" translate>\n" +
    "          Before receiving funds, you must backup your wallet. If this device is lost, it is impossible to access your funds without a backup.\n" +
    "        </p>\n" +
    "        <button class=\"m20t button black expand round\" href ui-sref=backup ng-style=\"{'background-color':index.backgroundColor}\">\n" +
    "          <span translate>Backup now</span>\n" +
    "        </button>\n" +
    "      </div>\n" +
    "      <div ng-show=!index.needsBackup>\n" +
    "        <div class=\"box-notification m20t\" ng-show=home.addrError>\n" +
    "          <span class=text-warning>\n" +
    "            {{home.addrError|translate}}\n" +
    "          </span>\n" +
    "        </div>\n" +
    "        <div class=row>\n" +
    "          \n" +
    "          <div class=\"large-12 columns\">\n" +
    "            <h2 class=\"text-center m10t\" translate>My Bitcoin address</h2>\n" +
    "            <div class=text-center ng-click=\"home.copyToClipboard(home.addr, $event)\" ng-show=\"home.addr || home.generatingAddress\">\n" +
    "              <qrcode size=220 data=bitcoin:{{home.addr}}></qrcode>\n" +
    "              <div ng-show=home.generatingAddress style=\"position:relative; top:-226px; height:0px\">\n" +
    "                <div style=\"height:220px; width:220px; margin:auto; background: white\">\n" +
    "                  <ion-spinner class=spinner-stable icon=lines style=\"margin-top: 85px\"></ion-spinner>\n" +
    "                </div>\n" +
    "              </div>\n" +
    "              <div class=m10t>\n" +
    "                <h4 ng-class=\"{'enable_text_select': !index.isCordova}\" class=size-12>\n" +
    "                  {{home.generatingAddress ? '...' : home.addr}}\n" +
    "                </h4>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "        <div class=\"row m20t\">\n" +
    "          <div class=\"small-12 columns\" ng-show=\"index.isCordova && home.addr\">\n" +
    "            <button class=\"button outline light-gray small round expand\" on-tap=home.shareAddress(home.addr) ng-disabled=home.generatingAddress>\n" +
    "              <span translate>Share address</span>\n" +
    "            </button>\n" +
    "          </div>\n" +
    "          <div class=\"small-12 columns\"> \n" +
    "            <button class=\"button expand small round m10b\" ng-click=openAmountModal(home.addr) ng-style=\"{'background-color':index.backgroundColor}\" ng-disabled=home.generatingAddress>\n" +
    "              <span translate>Request a specific amount</span>\n" +
    "            </button>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "        <div class=\"row m10t\" ng-show=home.addr>\n" +
    "          <div class=\"large-12 columns\">\n" +
    "            <div class=\"line-t size-10 text-gray m10b p10t\" ng-show=!index.isSingleAddress>\n" +
    "              <span translate> Share this wallet address to receive payments. To protect your privacy, new addresses are generated automatically once you use them.</span>\n" +
    "                <a ng-show=!home.generatingAddress ng-click=home.setAddress(true) translate>Generate new address</a>\n" +
    "            </div>\n" +
    "            <div class=\"line-t size-10 text-gray m10b p10t\" ng-show=index.isSingleAddress>\n" +
    "              <span translate> Share this wallet address to receive payments</span>.\n" +
    "            </div>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div class=extra-margin-bottom></div>\n" +
    "    </div> \n" +
    "\n" +
    "\n" +
    "    \n" +
    "    <div id=send class=\"send tab-view\">\n" +
    "      <div class=\"pr p25b\">\n" +
    "        <h4 class=\"title m0\" ng-show=!index.updating>\n" +
    "          <available-balance ng-show=!index.shouldHideBalance></available-balance>\n" +
    "          <span ng-show=\"home.lockedCurrentFeePerKb || home.lockAmount\" class=text-gray translate>Send Max</span>\n" +
    "          <a ng-show=\"index.availableBalanceSat > 0 && !home.lockedCurrentFeePerKb  && !home.lockAmount && !index.asset.isAsset\" ng-click=home.sendMax(index.availableBalanceSat) translate>Send Max\n" +
    "          </a>\n" +
    "          <div ng-show=\"!home.paymentExpired && home._paypro\">\n" +
    "            <span translate>Payment expires</span>\n" +
    "            <time> {{home.remainingTimeStr}}</time>\n" +
    "          </div>\n" +
    "        </h4>\n" +
    "        <div class=camera-icon ng-show=index.isComplete>\n" +
    "          <qr-scanner on-scan=home.onQrCodeScanned(data)></qr-scanner>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div class=\"box-notification m20t\" ng-show=home.error ng-click=home.resetError()>\n" +
    "        <span class=text-warning>\n" +
    "          {{home.error|translate}}\n" +
    "        </span>\n" +
    "      </div>\n" +
    "      <div class=\"row m20t\">\n" +
    "        <div class=\"large-12 large-centered columns\">\n" +
    "          <form name=sendForm novalidate>\n" +
    "\n" +
    "            <div ng-hide=home._paypro>\n" +
    "              <div class=\"row collapse\">\n" +
    "                <label for=address class=left>\n" +
    "                  <span translate>To</span>\n" +
    "                </label>\n" +
    "                <span ng-hide=sendForm.address.$pristine>\n" +
    "                  <span class=\"has-error right size-12\" ng-show=\"sendForm.address.$invalid && _address\">\n" +
    "                    <i class=\"icon-close-circle size-14\"></i>\n" +
    "                    <span class=vm translate>Not valid</span>\n" +
    "                  </span>\n" +
    "                  <small class=\"right text-primary\" ng-show=!sendForm.address.$invalid>\n" +
    "                    <i class=\"icon-checkmark-circle size-14\"></i>\n" +
    "                  </small>\n" +
    "                </span>\n" +
    "              </div>\n" +
    "\n" +
    "              <div class=input>\n" +
    "                <input ng-show=sendForm.address.$invalid class=m0 id=address name=address ng-disabled=\" home.lockAddress\" ng-attr-placeholder=\"{{'Bitcoin address'|translate}}\" ng-model=_address valid-address required ng-focus=\"home.formFocus('address')\" ng-blur=home.formFocus(false)>\n" +
    "                <div class=addressbook-input ng-show=\"!sendForm.address.$invalid && _address\">\n" +
    "                  {{index.addressbook[_address] || _address}}\n" +
    "                </div>\n" +
    "                <a class=\"postfix size-12 m0 text-gray\" ng-style=\"{'color':index.backgroundColor}\" ng-click=\"home.openAddressbookModal(index.otherWallets, _address)\">\n" +
    "                  <i class=\"icon-wallet text-bold size-18\"></i>\n" +
    "                </a>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "            <div ng-show=home._paypro>\n" +
    "              <div class=\"row collapse\" ng-click=home.openPPModal(home._paypro)>\n" +
    "\n" +
    "                <label for=domain>\n" +
    "                  <span translate>Payment to</span>\n" +
    "                </label>\n" +
    "\n" +
    "                <div class=\"input block\">\n" +
    "                  <input class=p45li id=domain name=domain ng-model=home._paypro.domain ng-disabled=1>\n" +
    "                  <i ng-show=\"home._paypro.verified && home._paypro.caTrusted\" class=\"fi-lock color-greeni\"></i>\n" +
    "                  <i ng-show=!home._paypro.caTrusted class=\"fi-unlock color-yellowi\"></i>\n" +
    "                </div>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=row>\n" +
    "              <div class=\"large-12 medium-12 columns\">\n" +
    "                <div class=right ng-hide=\"sendForm.amount.$pristine && !sendForm.amount.$modelValue \">\n" +
    "                  <span class=\"has-error right size-12\" ng-show=sendForm.amount.$invalid>\n" +
    "                    <i class=\"icon-close-circle size-14\"></i>\n" +
    "                    <span clas=vm translate>Not valid</span>\n" +
    "                  </span>\n" +
    "                  <small class=\"text-primary right\" ng-show=\"!sendForm.amount.$invalid && !sendForm.alternative.$invalid\">\n" +
    "                    <i class=\"icon-checkmark-circle size-14\"></i>\n" +
    "                  </small>\n" +
    "                </div>\n" +
    "                <div>\n" +
    "                  <label for=amount>\n" +
    "                    <span translate>Amount</span><span ng-show=\"showAlternative && !index.asset.isAsset\"> [{{home.alternativeIsoCode}}]</span>\n" +
    "                  </label>\n" +
    "                  <div class=input>\n" +
    "                    <div ng-if=index.isCordova>\n" +
    "                      <input type=number ng-readonly=!home.lockAmount ng-show=\"!showAlternative && !index.asset.isAsset\" id=amount ng-disabled=home.lockAmount name=amount ng-attr-placeholder=\"{{'Amount in'|translate}} {{home.unitName}}\" ng-model=_amount valid-amount unit-decimals=\"{{ index.asset.isAsset ? index.asset.divisibility : '' }}\" required autocomplete=off ng-click=openInputAmountModal() ignore-mouse-wheel>\n" +
    "                      <input type=number ng-readonly=!home.lockAmount ng-show=\"showAlternative && !index.asset.isAsset\" id=alternative ng-disabled=\"!home.isRateAvailable || home.lockAmount\" name=alternative ng-attr-placeholder=\"{{'Amount in'|translate}} {{ home.alternativeName }}\" ng-model=_alternative required autocomplete=off ng-click=openInputAmountModal() ignore-mouse-wheel>\n" +
    "                      <input type=number ng-readonly=!home.lockAmount ng-show=index.asset.isAsset id=amount ng-disabled=home.lockAmount name=amount ng-attr-placeholder=\"{{'Amount in'|translate}} {{index.asset.unitSymbol.pluralSymbol}}\" ng-model=_amount valid-amount unit-decimals=\"{{ index.asset.isAsset ? index.asset.divisibility : '' }}\" required autocomplete=off ng-click=openInputAmountModal() ignore-mouse-wheel>\n" +
    "                    </div>\n" +
    "                    <div ng-if=!index.isCordova>\n" +
    "                      <input type=number ng-show=\"!showAlternative && !index.asset.isAsset\" id=amount ng-disabled=home.lockAmount name=amount ng-attr-placeholder=\"{{'Amount in'|translate}} {{home.unitName}}\" ng-model=_amount valid-amount unit-decimals=\"{{ index.asset.isAsset ? index.asset.divisibility : '' }}\" required autocomplete=off ignore-mouse-wheel>\n" +
    "                      <input type=number ng-show=\"showAlternative && !index.asset.isAsset\" id=alternative ng-disabled=\"!home.isRateAvailable || home.lockAmount\" name=alternative ng-attr-placeholder=\"{{'Amount in'|translate}} {{ home.alternativeName }}\" ng-model=_alternative required autocomplete=off ignore-mouse-wheel>\n" +
    "                      <input type=number ng-show=index.asset.isAsset id=amount ng-disabled=home.lockAmount name=amount ng-attr-placeholder=\"{{'Amount in'|translate}} {{index.asset.unitSymbol.pluralSymbol}}\" ng-model=_amount valid-amount unit-decimals=\"{{ index.asset.isAsset ? index.asset.divisibility : '' }}\" required autocomplete=off ignore-mouse-wheel>\n" +
    "                    </div>\n" +
    "                    <a class=\"postfix button\" ng-show=\"!showAlternative && !index.asset.isAsset\" ng-style=\"{'background-color':index.backgroundColor}\" ng-click=\"showAlternative = !showAlternative\">{{home.unitName}}</a>\n" +
    "                    <a class=\"postfix button black\" ng-show=\"showAlternative && !index.asset.isAsset\" ng-click=\"showAlternative = !showAlternative\">{{home.alternativeIsoCode}}</a>\n" +
    "                    <a class=\"postfix button\" ng-show=index.asset.isAsset ng-style=\"{'background-color':index.backgroundColor}\">{{index.asset.unitSymbol.pluralSymbol}}</a>\n" +
    "                  </div>\n" +
    "                </div>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "            <div class=row ng-hide=home.hideNote>\n" +
    "              <div class=\"large-12 columns\">\n" +
    "                <label for=comment><span translate>Description</span>\n" +
    "                  <small translate ng-hide=!sendForm.comment.$pristine>optional</small>\n" +
    "                  <small translate class=has-error ng-show=\"sendForm.comment.$invalid && !sendForm.comment.$pristine\">too long!</small>\n" +
    "                </label>\n" +
    "                <div class=input>\n" +
    "                  <textarea id=comment name=comment ng-maxlength=500 ng-model=_comment ng-focus=\"home.formFocus('msg')\" ng-blur=home.formFocus(false)></textarea>\n" +
    "                </div>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=row>\n" +
    "              <div class=\"large-6 medium-6 small-6 columns\" ng-show=\"(home._paypro || home.lockAddress ||\n" +
    "                home.lockAmount || !sendForm.amount.$pristine)\">\n" +
    "                <a ng-click=home.resetForm(sendForm) class=\"button expand outline dark-gray round\" translate>Cancel</a>\n" +
    "              </div>\n" +
    "              <div class=columns ng-class=\"{'small-6 medium-6 large-6':(home._paypro || home.lockAddress ||\n" +
    "                home.lockAmount  || !sendForm.amount.$pristine)}\">\n" +
    "                <button class=\"button black round expand\" ng-disabled=\"sendForm.$invalid || home.paymentExpired || index.updating\" ng-style=\"{'background-color':index.backgroundColor}\" ng-click=home.submitForm() translate>\n" +
    "                  Send\n" +
    "                </button>\n" +
    "              </div>\n" +
    "\n" +
    "            </div>\n" +
    "          </form>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div class=extra-margin-bottom></div>\n" +
    "    </div> \n" +
    "\n" +
    "    <div id={{view.id}} class=\"{{view.class}} tab-view\" ng-repeat=\"view in index.addonViews\" ng-include=view.template>\n" +
    "    </div>\n" +
    "\n" +
    "  </div>\n" +
    "</div>\n" +
    "<div class=extra-margin-bottom></div>\n" +
    "<div ng-include=\"'views/includes/menu.html'\" ng-show=\"!index.noFocusedWallet && !$root.shouldHideMenuBar\"></div>\n"
  );


  $templateCache.put('views/walletInfo.html',
    "<div class=topbar-container ng-include=\"'views/includes/topbar.html'\" ng-init=\"titleSection='Wallet Information'; goBackToState = 'walletHome';\">\n" +
    "</div>\n" +
    "\n" +
    "<div ng-include=\"'views/includes/progressReport.html'\"></div>\n" +
    "\n" +
    "<div class=\"content preferences\" ng-controller=\"walletInfoController as walletInfo\">\n" +
    "    <h4 class=\"title m0\" ng-show=walletInfo.assets translate>Asset</h4>\n" +
    "\n" +
    "    <div ng-repeat=\"asset in walletInfo.assets\" ng-mouseover=\"walletInfo.hoverId = asset.assetId\">\n" +
    "      <a class=remove-asset-link translate ng-show=\"asset.custom && walletInfo.hoverId == asset.assetId\" ng-click=walletInfo.removeCustomAsset(asset.assetId)>\n" +
    "          <i class=\"fi-x size-18\"></i>\n" +
    "      </a>\n" +
    "      <ion-radio class=\"line-b size-12 radio-label\" ng-value=asset.assetId ng-model=walletInfo.assetId ng-click=walletInfo.setSelectedAsset(asset.assetId)>\n" +
    "          {{ asset.assetName | rawHtml }}\n" +
    "          <span class=right style=\"margin-right: 20px\">{{ asset.balanceStr | rawHtml }}</span>\n" +
    "      </ion-radio>\n" +
    "    </div>\n" +
    "    <h4></h4>\n" +
    "    <div class=text-center>\n" +
    "      <a class=\"button outline light-gray tiny round\" ng-click=walletInfo.showTokenModal() translate>ADD TOKEN</a>\n" +
    "    </div>\n" +
    "</div>\n" +
    "<div class=extra-margin-bottom></div>\n"
  );

}]);
