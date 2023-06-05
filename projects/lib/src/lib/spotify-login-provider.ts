import { BaseLoginProvider, SocialUser } from '@abacritt/angularx-social-login';
import { HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { UtilsService } from './utils.service';

export interface SpotifyInitOptions {
    /**
     * Your app’s registered redirect URI. The access token is sent to this URI.
     * Make sure they match or the authentication will not work.
     */
    redirectUri: string;
    /**
     * Set showDialog to `true` for previous authorized users to still re-approve the application [default]
     * or set to `false` so they can skip the authorization screen
     */
    showDialog?: boolean;
    /**
     * A list of scopes. The APIs that you’re calling identify the scopes you must list.
     */
    scopes: string | string[];
}

export class SpotifyLoginProvider extends BaseLoginProvider {

    public static readonly PROVIDER_ID: string = 'SPOTIFY';

    private static readonly SPOTIFY_AUTH_URL: string = 'https://accounts.spotify.com/authorize';
    private static readonly SPOTIFY_USER_URL: string = 'https://api.spotify.com/v1/me';

    constructor(
        private clientId: string,
        private readonly initOptions: SpotifyInitOptions,
    ) {
        super();
    }

    initialize(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Gets the logged in socialUser details
     * @returns SocialUser
     */
    getLoginStatus(): Promise<SocialUser> {
        return new Promise((resolve, reject) => {
            const accessToken = this.retrieveToken();
            if (accessToken) {
                this.getUserInformation(accessToken).then(user => {
                    resolve(user);
                }, (error) => {
                    this.clearToken();
                    reject(error)
                });
            } else {
                reject(`No user is currently logged in with ${SpotifyLoginProvider.PROVIDER_ID}`);
            }
        });
    }

    /**
     * Opens the popup window for Spotify authentication
     * @returns SocialUser
     */
    signIn(): Promise<SocialUser> {
        return new Promise(async (resolve, reject) => {
            const popupWidth = 500;
            const popupHeight = 600;
            const left = window.screen.width / 2 - popupWidth / 2;
            const top = window.screen.height / 2 - popupHeight / 2;

            const popupWindow = window.open(
                this.getAuthorizationUrl(),
                'spotify-popup',
                `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`);

            if (popupWindow) {
                const checkAccessToken = setInterval(() => {
                    try {
                        if (popupWindow.closed) {
                            clearInterval(checkAccessToken);
                            reject('Spotify authentication window was closed.');
                        }

                        if (popupWindow.location.origin === window.location.origin) {
                            clearInterval(checkAccessToken);
                            popupWindow.close();

                            const hash = popupWindow.location.hash;
                            if (hash) {
                                const urlParams = new URLSearchParams(hash.replace('#', '?'));
                                const accessToken = urlParams.get('access_token');

                                if (accessToken) {
                                    this.persistToken(accessToken);
                                    this.getUserInformation(accessToken)
                                        .then((socialUser) => {
                                            this.persistToken(accessToken);
                                            resolve(socialUser);
                                        })
                                        .catch((error) => {
                                            reject(error);
                                        });
                                } else {
                                    reject('Spotify authentication failed.');
                                }
                            } else {
                                //If no hash was found than probably an error might have happened
                                const urlParams = new URLSearchParams(popupWindow.location.search);
                                if (urlParams.get('error')) {
                                    reject(`Spotify authentication failed: ${urlParams.get('error_description')}`);
                                }
                            }
                        }
                    } catch (error: any) {
                        const errorMessage = error.toString();
                        //Ignore the blocked a frame since it happens because of Cross Origin requests
                        if (!errorMessage.includes('Blocked a frame with origin')) {
                            reject(`Spotify authentication failed: ${errorMessage}`);
                            clearInterval(checkAccessToken);
                            popupWindow.close();
                        }
                    }
                }, 100);
            } else {
                reject('Unable to open Spotify authentication popup window.');
                return;
            }
        });
    }

    /**
     * Logout user and revoke token
     */
    signOut(): Promise<void> {
        return new Promise((resolve, reject) => {
            const accessToken = this.retrieveToken();
            if (accessToken) {
                this.clearToken();
                resolve();
            } else {
                reject(`No user is currently logged in with ${SpotifyLoginProvider.PROVIDER_ID}`);
            }
        })
    }

    /**
     * Get user details from Spotify
     * @param accessToken the accessToken
     * @returns SocialUser
     */
    private getUserInformation(accessToken: string): Promise<SocialUser> {
        return new Promise((resolve, reject) => {
            const headers = new HttpHeaders()
                .set('Authorization', 'Bearer ' + accessToken);

            UtilsService.sendRequest(SpotifyLoginProvider.SPOTIFY_USER_URL, 'GET', headers)
                .then(response => {
                    const socialUser = {
                        provider: SpotifyLoginProvider.PROVIDER_ID,
                        id: response.id,
                        name: response.display_name,
                        email: response.email,
                        authToken: accessToken,
                        idToken: '',
                        authorizationCode: '',
                        photoUrl: this.fetchImage(response),
                        firstName: '',
                        lastName: '',
                        response: '',
                    }
                    resolve(socialUser);
                }, error => {
                    reject(error);
                })
        });
    }

    /**
     * Gets the profile user image if user has one
     * @param response the get user details response
     */
    private fetchImage(response: any) {
        return (response.images.length == 0) ? '' : response.images[0].url;
    }

    /**
     * Save token in localStorage
     * @param token the accessToken
     */
    persistToken(token: string) {
        localStorage.setItem(`${SpotifyLoginProvider.PROVIDER_ID}_token`, token);
    }

    /**
     * Retrieve token from localStorage
     * @returns String
     */
    retrieveToken() {
        return localStorage.getItem(`${SpotifyLoginProvider.PROVIDER_ID}_token`);
    }

    /**
     * Remove token from localStorage
     */
    clearToken() {
        localStorage.removeItem(`${SpotifyLoginProvider.PROVIDER_ID}_token`);
    }

    /**
     * Constructs the authorization url with the needed and optional parameters
     * @returns String
     */
    private getAuthorizationUrl(): string {
        let scope;
        if (Array.isArray(this.initOptions.scopes)) {
            scope = this.initOptions.scopes.join(' ');
        } else {
            scope = this.initOptions.scopes;
        }
        const params = new HttpParams()
            .set('client_id', this.clientId)
            .set('show_dialog', this.initOptions.showDialog || true)
            .set('redirect_uri', this.initOptions.redirectUri)
            .set('response_type', 'token')
            .set('scope', scope);
        let request = new HttpRequest('GET', SpotifyLoginProvider.SPOTIFY_AUTH_URL, null, {params});

        return request.urlWithParams;
    }
}