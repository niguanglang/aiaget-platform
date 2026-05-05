import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildTraceHeaders,
  collectTracePropagationIssues,
} from '../verify-trace-propagation.mjs';

const traceId = '0123456789abcdef0123456789abcdef';
const spanId = '1111111111111111';

test('buildTraceHeaders emits W3C traceparent and x-trace-id', () => {
  assert.deepEqual(buildTraceHeaders(traceId, spanId), {
    traceparent: `00-${traceId}-${spanId}-01`,
    'x-trace-id': traceId,
  });
});

test('collectTracePropagationIssues accepts matching control and runtime trace responses', () => {
  assert.deepEqual(
    collectTracePropagationIssues({
      traceId,
      controlApi: {
        headers: {
          traceparent: `00-${traceId}-2222222222222222-01`,
          'x-trace-id': traceId,
        },
        body: { status: 'healthy' },
      },
      runtime: {
        body: {
          trace_id: traceId,
          steps: [
            { trace_id: traceId, span_id: '3333333333333333' },
            { trace_id: traceId, span_id: '4444444444444444' },
          ],
          model_call: { trace_id: traceId },
        },
      },
    }),
    [],
  );
});

test('collectTracePropagationIssues reports mismatched or missing trace fields', () => {
  assert.deepEqual(
    collectTracePropagationIssues({
      traceId,
      controlApi: {
        headers: {
          traceparent: '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-2222222222222222-01',
        },
        body: { status: 'healthy' },
      },
      runtime: {
        body: {
          trace_id: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          steps: [{ span_id: '3333333333333333' }],
          model_call: { trace_id: 'cccccccccccccccccccccccccccccccc' },
        },
      },
    }),
    [
      'Control API x-trace-id response header did not match the probe trace id',
      'Control API traceparent response header did not keep the probe trace id',
      'Runtime response trace_id did not match the probe trace id',
      'Runtime step 0 is missing the probe trace_id',
      'Runtime model_call.trace_id did not match the probe trace id',
    ],
  );
});
