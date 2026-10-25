import { Suspense, lazy } from 'react';
import type { ClassKey } from 'keycloakify/login';
import DefaultPage from 'keycloakify/login/DefaultPage';
import DefaultTemplate from './KeycloakTemplate';
import type { KcContext } from './KcContext';
import { useI18n } from './i18n';
import '../../app/styles/tokens.css';
import './fallback.css';

const UserProfileFormFields = lazy(() => import('keycloakify/login/UserProfileFormFields'));
const Register = lazy(() => import('./pages/Register'));

export default function KcPage({ kcContext }: { kcContext: KcContext }) {
  const { i18n } = useI18n({ kcContext });

  return (
    <Suspense>
      {(() => {
        switch (kcContext.pageId) {
          case 'register.ftl':
            return (
              <Register
                kcContext={kcContext}
                i18n={i18n}
                classes={classes}
                Template={DefaultTemplate}
                doUseDefaultCss={false}
              />
            );
          default:
            // Pages not ejected yet keep Keycloak's markup; fallback.css brings them on brand.
            return (
              <DefaultPage
                kcContext={kcContext}
                i18n={i18n}
                classes={classes}
                Template={DefaultTemplate}
                doUseDefaultCss={true}
                UserProfileFormFields={UserProfileFormFields}
                doMakeUserConfirmPassword={true}
              />
            );
        }
      })()}
    </Suspense>
  );
}

const classes = {} satisfies { [key in ClassKey]?: string };
