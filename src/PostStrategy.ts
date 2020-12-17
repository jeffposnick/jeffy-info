import {matchPrecache} from 'workbox-precaching';
import {Strategy, StrategyHandler} from 'workbox-strategies';
import nunjucks from 'nunjucks/browser/nunjucks';

export class PostStrategy extends Strategy {
  private _site?: Site;
  private _nunjucksEnv?: any;

  private _getNunjucksEnv(): any {
    if (!this._nunjucksEnv) {
      const CacheStorageLoader = nunjucks.Loader.extend({
        async: true,
      
        getSource: async function(name: string, callback: Function) {
          try {
            const path = `/_posts/_includes/${name}`;
            const cachedResponse = await matchPrecache(path);
            if (!cachedResponse) {
              throw new Error(`Unable to find precached response for ${path}.`);
            }
            const src = await cachedResponse.text();
            callback(null, {src, path, noCache: false});
          } catch(error) {
            callback(error);
          }
        }
      });
      
      this._nunjucksEnv = new nunjucks.Environment(
        new CacheStorageLoader()
      );
    }

    return this._nunjucksEnv;
  }

  private async _getSiteData(): Promise<Site> {
    if (!this._site) {
      const cacheKey = '/_posts/_data/site.json';
      const siteDataResponse = await matchPrecache(cacheKey);
      if (!siteDataResponse) {
        throw new Error(`Unable to find precached response for ${cacheKey}.`);
      }
      this._site = await siteDataResponse.json() as Site;
    }

    return this._site;
  }

  async _handle(request: Request, handler: StrategyHandler): Promise<Response> {
    if (!(handler.params && Array.isArray(handler.params))) {
      throw new Error(`Couldn't get parameters from router.`);
    }
  
    // handler.params[3] corresponds to post.fileSlug in 11ty.
    const cacheKey = `/_posts/${handler.params[3]}.json`;
    const cachedResponse = await matchPrecache(cacheKey);
    if (!cachedResponse) {
      throw new Error(`Unable to find precached response for ${cacheKey}.`);
    }
  
    const context = await cachedResponse.json();
    context.site = await this._getSiteData();
    context.content = context.html;
  
    const renderedTemplate: string = await new Promise((resolve, reject) => {
      const nunjucksEnv = this._getNunjucksEnv();
      nunjucksEnv.render(
        context.layout,
        context,
        (error: Error | undefined, result: string) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    });
  
    const headers = {
      'content-type': 'text/html',
    };
    return new Response(renderedTemplate, {headers});
  }
};
