import { SetMetadata } from '@nestjs/common';

export const SKIP_TRANSFORM_INTERCEPTOR = 'skipTransformInterceptor';

export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_INTERCEPTOR, true);
