import { MidwayContainer } from './midwayContainer';
import { REQUEST_CTX_KEY, IMidwayContainer } from '../interface';
import { parsePrefix } from '../util/';
import { PIPELINE_IDENTIFIER } from '@midwayjs/decorator';

export class MidwayRequestContainer extends MidwayContainer {
  private applicationContext: IMidwayContainer;

  constructor(ctx, applicationContext: IMidwayContainer) {
    super(null, applicationContext);
    this.applicationContext = applicationContext;
    // register ctx
    this.registerObject(REQUEST_CTX_KEY, ctx);

    if (ctx.logger) {
      // register contextLogger
      this.registerObject('logger', ctx.logger);
    }

    const resolverHandler = this.applicationContext.getResolverHandler();
    this.beforeEachCreated(
      resolverHandler.beforeEachCreated.bind(resolverHandler)
    );
    this.afterEachCreated(
      resolverHandler.afterEachCreated.bind(resolverHandler)
    );
  }
  protected createContainerIdx() {
    // requestContainer id = -1；
    return -1;
  }

  init() {
    // do nothing
  }

  get<T = any>(identifier: any, args?: any): T {
    if (typeof identifier !== 'string') {
      identifier = this.getIdentifier(identifier);
    }
    if (this.registry.hasObject(identifier)) {
      return this.registry.getObject(identifier);
    }
    const definition = this.applicationContext.registry.getDefinition(
      identifier
    );
    if (definition) {
      if (
        definition.isRequestScope() ||
        definition.id === PIPELINE_IDENTIFIER
      ) {
        // create object from applicationContext definition for requestScope
        const ins = this.getManagedResolverFactory().create({
          definition,
          args,
        });
        return this.wrapperAspectToInstance(ins);
      }
    }

    if (this.parent) {
      return this.parent.get(identifier, args);
    }
  }

  async getAsync<T = any>(identifier: any, args?: any): Promise<T> {
    if (typeof identifier !== 'string') {
      identifier = this.getIdentifier(identifier);
    }

    identifier = parsePrefix(identifier);

    if (this.registry.hasObject(identifier)) {
      return this.registry.getObject(identifier);
    }

    const definition = this.applicationContext.registry.getDefinition(
      identifier
    );
    if (definition) {
      if (
        definition.isRequestScope() ||
        definition.id === PIPELINE_IDENTIFIER
      ) {
        // create object from applicationContext definition for requestScope
        const ins = await this.getManagedResolverFactory().createAsync({
          definition,
          args,
        });
        return this.wrapperAspectToInstance(ins);
      }
    }

    if (this.parent) {
      return this.parent.getAsync<T>(identifier, args);
    }
  }

  async ready() {
    this.readied = true;
    // ignore other things
  }

  get configService() {
    return this.applicationContext.getConfigService();
  }

  get environmentService() {
    return this.applicationContext.getEnvironmentService();
  }
}
