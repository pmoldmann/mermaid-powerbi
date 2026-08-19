import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { SafeLink } from '../../src/SafeLink';
import { setHost } from '../../src/redux/slice';
import { createTestStore } from '../helpers/renderApp';
import { createMockHost, type MockHost } from '../mocks/powerbi';

function renderLink(href: string | undefined, host: MockHost = createMockHost()) {
    const store = createTestStore();
    store.dispatch(setHost(host));
    const result = render(
        <Provider store={store}>
            <SafeLink href={href}>link text</SafeLink>
        </Provider>
    );
    return { ...result, host };
}

/**
 * Power BI certification rule 1200.1.3: content coming from data fields must
 * never produce a navigable <a>. Relative hrefs would resolve against
 * https://app.powerbi.com/..., and http(s) anchors would navigate directly,
 * bypassing the host's launchUrl confirmation dialog.
 */
describe('SafeLink', () => {
    it('never renders an anchor element', () => {
        for (const href of ['https://example.test', '/relative', 'javascript:alert(1)', undefined]) {
            const { container, unmount } = renderLink(href);
            expect(container.querySelector('a')).toBeNull();
            unmount();
        }
    });

    describe('safe protocols', () => {
        it.each(['https://example.test/page', 'http://example.test', 'mailto:a@b.test'])(
            'renders %s as an activatable link',
            (href) => {
                renderLink(href);
                const link = screen.getByRole('link');
                expect(link).toHaveAttribute('title', href);
                expect(link).toHaveAttribute('tabindex', '0');
            }
        );

        it('launches the url through the host on click', async () => {
            const { host } = renderLink('https://example.test/page');
            await userEvent.click(screen.getByRole('link'));
            expect(host.launchUrl).toHaveBeenCalledWith('https://example.test/page');
        });

        it('launches on Enter and Space for keyboard users', async () => {
            const { host } = renderLink('https://example.test/page');
            screen.getByRole('link').focus();
            await userEvent.keyboard('{Enter}');
            await userEvent.keyboard(' ');
            expect(host.launchUrl).toHaveBeenCalledTimes(2);
        });

        it('ignores surrounding whitespace in the href', async () => {
            const { host } = renderLink('  https://example.test/page  ');
            await userEvent.click(screen.getByRole('link'));
            expect(host.launchUrl).toHaveBeenCalledWith('https://example.test/page');
        });

        it('is case-insensitive about the protocol', () => {
            renderLink('HTTPS://example.test');
            expect(screen.getByRole('link')).toBeInTheDocument();
        });
    });

    describe('unsafe or unknown targets', () => {
        it.each([
            'javascript:alert(1)',
            'data:text/html,<script>alert(1)</script>',
            'file:///c:/windows/system32',
            'vbscript:msgbox(1)',
            '/relative/path',
            'relative.html',
            '//protocol-relative.test',
            'tel:+123456789',
            '#anchor',
        ])('renders %s as inert text', (href) => {
            const { container } = renderLink(href);
            expect(screen.queryByRole('link')).toBeNull();
            expect(container.querySelector('.md-link-inert')).toHaveTextContent('link text');
        });

        it('never calls launchUrl for an unsafe href', async () => {
            const { host, container } = renderLink('javascript:alert(1)');
            await userEvent.click(container.querySelector('.md-link-inert')!);
            expect(host.launchUrl).not.toHaveBeenCalled();
        });

        it('renders a missing href as inert text', () => {
            const { container } = renderLink(undefined);
            expect(container.querySelector('.md-link-inert')).toBeInTheDocument();
        });
    });

    // Without a Power BI host (developer mode) openExternalLink falls back to a
    // confirm() prompt — it must never open a window without one.
    describe('without a host', () => {
        function renderHostless() {
            const store = createTestStore();
            return render(
                <Provider store={store}>
                    <SafeLink href="https://example.test">link text</SafeLink>
                </Provider>
            );
        }

        it('opens nothing when the user declines the confirmation', async () => {
            const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
            renderHostless();

            await userEvent.click(screen.getByRole('link'));

            expect(confirmSpy).toHaveBeenCalled();
            expect(windowOpen).not.toHaveBeenCalled();
            windowOpen.mockRestore();
            confirmSpy.mockRestore();
        });

        it('opens with noopener/noreferrer once confirmed', async () => {
            const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
            renderHostless();

            await userEvent.click(screen.getByRole('link'));

            expect(windowOpen).toHaveBeenCalledWith('https://example.test', '_blank', 'noopener,noreferrer');
            windowOpen.mockRestore();
            confirmSpy.mockRestore();
        });
    });
});
