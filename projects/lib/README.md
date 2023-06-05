# Spotify Angular Social Login

## Description
Spotify social login extension for [@abacritt/angularx-social-login](https://github.com/abacritt/angularx-social-login) Angular Library.

## Installation

### Install via npm
```bash
npm i @abacritt/angularx-social-login @eugenmirce/anguarx-social-login-spotify
```
Also installing the angularx-social-login module as it is a dependency.

### Import the module
Import the `angularx-social-login` modules needed for the social login.  
Add `SocialLoginModule` and `SocialAuthServiceConfig` in your `AppModule`. Then import the `SpotifyLoginProvider` and then configure the `SocialLoginModule` with the `SpotifyLoginProvider`.
```javascript
import {SocialLoginModule, SocialAuthServiceConfig} from '@abacritt/angularx-social-login';
import {SpotifyLoginProvider} from '@eugenmirce/angularx-social-login-spotify';

@NgModule({
  declarations: [
    ...
  ],
  imports: [
    ...
    SocialLoginModule
  ],
  providers: [
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: SpotifyLoginProvider.PROVIDER_ID,
            provider: new SpotifyLoginProvider(
              'YOUR_CLIENT_ID',
              {
                redirectUri: 'YOUR_REDIRECT_URL',
                scopes: ['user-read-email']
              }
            )
          }
        ],
        onError: (err) => {
          console.error(err);
        }
      } as SocialAuthServiceConfig,
    }],
    // other module configurations
})
export class AppModule { }
```

### Sign in with Spotify

```javascript

import { SocialAuthService } from "@abacritt/angularx-social-login";
import { SpotifyLoginProvider } from "@eugenmirce/angularx-social-login-spotify";

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.css']
})
export class DemoComponent {

  constructor(private authService: SocialAuthService) { }

  signInWithSpotify(): void {
    this.authService.signIn(SpotifyLoginProvider.PROVIDER_ID);
  }

  signOut(): void {
    this.authService.signOut();
  }
}
```

### Specifying custom scopes
```javascript
const spotifyInitOptions: {
  redirectUri: 'YOUR_REDIRECT_URI',
  scopes: ['identify', 'email'], // To get access to logged in user information and email
  showDialog: true // Use `false` to skip the authorization screen for already authorized users [default is `false`]
};
```
You can use them in the `AppModule`

```javascript
...
providers: [
    {
        id: SpotifyLoginProvider.PROVIDER_ID,
        provider: new SpotifyLoginProvider(
            'YOUR_CLIENT_ID', spotifyInitOptions
        )
    }
]
...
```

### Check our other social login providers in Angular

| Name                          | Repository | NPM |
|-------------------------------|---|---|
| angularx-social-login-twitch  | [Github](https://github.com/eugenmirce/angularx-social-login-twitch) | [npm](https://www.npmjs.com/package/@eugenmirce/angularx-social-login-twitch)|
| angularx-social-login-discord | [Github](https://github.com/eugenmirce/angularx-social-login-discord) | [npm](https://www.npmjs.com/package/@eugenmirce/angularx-social-login-discord)|
