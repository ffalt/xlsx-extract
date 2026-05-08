import { SaxSax } from '../src/xml';

describe('SaxSax', () => {
	describe('onClose()', () => {
		it('calls notify with error when the SAX parser emits an error', () => {
			const parser = new SaxSax();
			const testError = new Error('parse error');
			let receivedError: Error | undefined;
			parser.onClose(error => {
				receivedError = error;
			});
			parser.parser.emit('error', testError);
			expect(receivedError).toBe(testError);
		});

		it('suppresses a second error after the first has been reported', () => {
			const parser = new SaxSax();
			let callCount = 0;
			parser.onClose(() => {
				callCount++;
			});
			parser.parser.emit('error', new Error('first'));
			parser.parser.emit('error', new Error('second'));
			expect(callCount).toBe(1);
		});

		it('suppresses the end notification when an error was already reported', () => {
			const parser = new SaxSax();
			let callCount = 0;
			parser.onClose(() => {
				callCount++;
			});
			parser.parser.emit('error', new Error('error'));
			parser.parser.emit('end');
			expect(callCount).toBe(1);
		});

		it('calls notify without error on a clean end', () => {
			const parser = new SaxSax();
			let receivedError: Error | undefined | null = null;
			parser.onClose(error => {
				receivedError = error;
			});
			parser.parser.emit('end');
			expect(receivedError).toBeUndefined();
		});
	});
});
