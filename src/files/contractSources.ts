import * as asChainIndex from 'as-chain/assembly/index.ts?assembly'
import * as asChainAction from 'as-chain/assembly/action.ts?assembly'
import * as asChainAsset from 'as-chain/assembly/asset.ts?assembly'
import * as asChainBignum from 'as-chain/assembly/bignum.ts?assembly'
import * as asChainBinaryextension from 'as-chain/assembly/binaryextension.ts?assembly'
import * as asChainCrypto from 'as-chain/assembly/crypto.ts?assembly'
import * as asChainDbi64 from 'as-chain/assembly/dbi64.ts?assembly'
import * as asChainDebug from 'as-chain/assembly/debug.ts?assembly'
import * as asChainEnv from 'as-chain/assembly/env.ts?assembly'
import * as asChainFloat128 from 'as-chain/assembly/float128.ts?assembly'
import * as asChainHelpers from 'as-chain/assembly/helpers.ts?assembly'
import * as asChainIdx64 from 'as-chain/assembly/idx64.ts?assembly'
import * as asChainIdx128 from 'as-chain/assembly/idx128.ts?assembly'
import * as asChainIdx256 from 'as-chain/assembly/idx256.ts?assembly'
import * as asChainIdxdb from 'as-chain/assembly/idxdb.ts?assembly'
import * as asChainIdxf64 from 'as-chain/assembly/idxf64.ts?assembly'
import * as asChainIdxf128 from 'as-chain/assembly/idxf128.ts?assembly'
import * as asChainMi from 'as-chain/assembly/mi.ts?assembly'
import * as asChainName from 'as-chain/assembly/name.ts?assembly'
import * as asChainOptional from 'as-chain/assembly/optional.ts?assembly'
import * as asChainSerializer from 'as-chain/assembly/serializer.ts?assembly'
import * as asChainSingleton from 'as-chain/assembly/singleton.ts?assembly'
import * as asChainSystem from 'as-chain/assembly/system.ts?assembly'
import * as asChainTime from 'as-chain/assembly/time.ts?assembly'
import * as asChainTransaction from 'as-chain/assembly/transaction.ts?assembly'
import * as asChainUtils from 'as-chain/assembly/utils.ts?assembly'
import * as asChainVarint from 'as-chain/assembly/varint.ts?assembly'
import * as asChainVariant from 'as-chain/assembly/variant.ts?assembly'

import * as asBignumIndex from 'as-bignum/assembly/index.ts?assembly'
import * as asBignumUtils from 'as-bignum/assembly/utils.ts?assembly'
import * as asBignumGlobals from 'as-bignum/assembly/globals.ts?assembly'
import * as asBignumIntegerIndex from 'as-bignum/assembly/integer/index.ts?assembly'
import * as asBignumIntegeri128 from 'as-bignum/assembly/integer/i128.ts?assembly'
import * as asBignumIntegeru128 from 'as-bignum/assembly/integer/u128.ts?assembly'
import * as asBignumIntegeri256 from 'as-bignum/assembly/integer/i256.ts?assembly'
import * as asBignumIntegeru256 from 'as-bignum/assembly/integer/u256.ts?assembly'
import * as asBignumIntegerSafeIndex from 'as-bignum/assembly/integer/safe/index.ts?assembly'
import * as asBignumIntegerSafei64 from 'as-bignum/assembly/integer/safe/i64.ts?assembly'
import * as asBignumIntegerSafei128 from 'as-bignum/assembly/integer/safe/i128.ts?assembly'
import * as asBignumIntegerSafei256 from 'as-bignum/assembly/integer/safe/i256.ts?assembly'
import * as asBignumIntegerSafeu64 from 'as-bignum/assembly/integer/safe/u64.ts?assembly'
import * as asBignumIntegerSafeu128 from 'as-bignum/assembly/integer/safe/u128.ts?assembly'
import * as asBignumIntegerSafeu256 from 'as-bignum/assembly/integer/safe/u256.ts?assembly'

export * as protonTscTypes from '../types/proton-tsc.d.ts.txt?assembly'

export default {
    '/node_modules/proton-tsc/index.ts': asChainIndex.default,
    '/node_modules/proton-tsc/action.ts': asChainAction.default,
    '/node_modules/proton-tsc/asset.ts': asChainAsset.default,
    '/node_modules/proton-tsc/bignum.ts': asChainBignum.default,
    '/node_modules/proton-tsc/binaryextension.ts': asChainBinaryextension.default,
    '/node_modules/proton-tsc/crypto.ts': asChainCrypto.default,
    '/node_modules/proton-tsc/dbi64.ts': asChainDbi64.default,
    '/node_modules/proton-tsc/debug.ts': asChainDebug.default,
    '/node_modules/proton-tsc/env.ts': asChainEnv.default,
    '/node_modules/proton-tsc/float128.ts': asChainFloat128.default,
    '/node_modules/proton-tsc/helpers.ts': asChainHelpers.default,
    '/node_modules/proton-tsc/idx64.ts': asChainIdx64.default,
    '/node_modules/proton-tsc/idx128.ts': asChainIdx128.default,
    '/node_modules/proton-tsc/idx256.ts': asChainIdx256.default,
    '/node_modules/proton-tsc/idxdb.ts': asChainIdxdb.default,
    '/node_modules/proton-tsc/idxf64.ts': asChainIdxf64.default,
    '/node_modules/proton-tsc/idxf128.ts': asChainIdxf128.default,
    '/node_modules/proton-tsc/mi.ts': asChainMi.default,
    '/node_modules/proton-tsc/name.ts': asChainName.default,
    '/node_modules/proton-tsc/serializer.ts': asChainSerializer.default,
    '/node_modules/proton-tsc/singleton.ts': asChainSingleton.default,
    '/node_modules/proton-tsc/system.ts': asChainSystem.default,
    '/node_modules/proton-tsc/time.ts': asChainTime.default,
    '/node_modules/proton-tsc/transaction.ts': asChainTransaction.default,
    '/node_modules/proton-tsc/optional.ts': asChainOptional.default,
    '/node_modules/proton-tsc/utils.ts': asChainUtils.default,
    '/node_modules/proton-tsc/varint.ts': asChainVarint.default,
    '/node_modules/proton-tsc/variant.ts': asChainVariant.default,

    '/node_modules/as-bignum/index.ts': asBignumIndex.default,
    '/node_modules/as-bignum/utils.ts': asBignumUtils.default,
    '/node_modules/as-bignum/globals.ts': asBignumGlobals.default,
    '/node_modules/as-bignum/integer/index.ts': asBignumIntegerIndex.default,
    '/node_modules/as-bignum/integer/i128.ts': asBignumIntegeri128.default,
    '/node_modules/as-bignum/integer/u128.ts': asBignumIntegeru128.default,
    '/node_modules/as-bignum/integer/i256.ts': asBignumIntegeri256.default,
    '/node_modules/as-bignum/integer/u256.ts': asBignumIntegeru256.default,
    '/node_modules/as-bignum/integer/safe/index.ts': asBignumIntegerSafeIndex.default,
    '/node_modules/as-bignum/integer/safe/i64.ts': asBignumIntegerSafei64.default,
    '/node_modules/as-bignum/integer/safe/i128.ts': asBignumIntegerSafei128.default,
    '/node_modules/as-bignum/integer/safe/i256.ts': asBignumIntegerSafei256.default,
    '/node_modules/as-bignum/integer/safe/u64.ts': asBignumIntegerSafeu64.default,
    '/node_modules/as-bignum/integer/safe/u128.ts': asBignumIntegerSafeu128.default,
    '/node_modules/as-bignum/integer/safe/u256.ts': asBignumIntegerSafeu256.default,
}