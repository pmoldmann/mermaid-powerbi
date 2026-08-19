import { describe, it, expect } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderApp } from '../helpers/renderApp';
import { singleDataView, stringOfLength, tableDataView } from '../fixtures/dataView';
import { VISUAL_VERSION } from '../../src/WelcomePage';

describe('Application — landing page', () => {
    it('shows the welcome page when no data is bound', async () => {
        renderApp({ dataView: null });
        expect(await screen.findByText(`v${VISUAL_VERSION}`)).toBeInTheDocument();
    });

    it('shows the welcome page when the bound column is empty', async () => {
        renderApp({ dataView: tableDataView([{ displayName: 'Doc' }], [[null], ['  ']]) });
        expect(await screen.findByText(`v${VISUAL_VERSION}`)).toBeInTheDocument();
        expect(document.querySelector('.markdown-container')).toBeNull();
    });
});

describe('Application — markdown rendering', () => {
    it('renders headings, emphasis and lists as real DOM elements', async () => {
        renderApp({
            dataView: singleDataView('# Title\n\nSome **bold** text.\n\n- one\n- two'),
        });

        expect(await screen.findByRole('heading', { level: 1, name: 'Title' })).toBeInTheDocument();
        expect(screen.getByText('bold').tagName).toBe('STRONG');
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    it('renders one section per row, separated by a horizontal rule', async () => {
        const { container } = renderApp({
            dataView: tableDataView([{ displayName: 'Doc' }], [['# First'], ['# Second'], ['# Third']]),
        });

        await waitFor(() => {
            expect(container.querySelectorAll('[data-section-index]')).toHaveLength(3);
        });
        expect(container.querySelectorAll('hr.section-separator')).toHaveLength(2);
        expect(container.querySelector('[data-section-index="1"]')).toHaveTextContent('Second');
    });

    it('keeps the original row index on each section', async () => {
        const { container } = renderApp({
            dataView: tableDataView([{ displayName: 'Doc' }], [['a'], ['b']]),
        });
        await waitFor(() => expect(container.querySelectorAll('[data-section-index]')).toHaveLength(2));
        expect(container.querySelector('[data-section-index="1"]')).toHaveAttribute('data-row-index', '1');
    });

    it('applies the configured font settings as CSS variables', async () => {
        const { container } = renderApp({
            dataView: singleDataView('text'),
            settings: (s) => {
                s.font.fontFamily = 'Segoe UI';
                s.font.bodyFontSize = 12;
            },
        });
        const content = await waitFor(() => container.querySelector<HTMLElement>('.markdown-content')!);
        expect(content.style.getPropertyValue('--md-font-family')).toBe('Segoe UI');
        expect(content.style.getPropertyValue('--md-body-font-size')).toBe('12pt');
    });

    it('switches the colour mode to dark', async () => {
        const { container } = renderApp({
            dataView: singleDataView('text'),
            settings: (s) => { s.view.colorMode = 'dark'; },
        });
        await waitFor(() => {
            expect(container.querySelector('.markdown-content')).toHaveAttribute('data-color-mode', 'dark');
        });
    });

    it('adds the high-contrast class when the host reports high contrast', async () => {
        const { container } = renderApp({ dataView: singleDataView('text'), isHighContrast: true });
        await waitFor(() => {
            expect(container.querySelector('.markdown-content')).toHaveClass('high-contrast');
        });
    });

    it('renders markdown links through SafeLink, never as anchors', async () => {
        const { container } = renderApp({
            dataView: singleDataView('[click me](https://example.test) and [relative](/x)'),
        });
        await waitFor(() => expect(screen.getByText('click me')).toBeInTheDocument());
        expect(container.querySelectorAll('a')).toHaveLength(0);
        expect(screen.getByText('click me')).toHaveAttribute('role', 'link');
        expect(screen.getByText('relative')).toHaveClass('md-link-inert');
    });
});

describe('Application — truncation banner', () => {
    it('warns when a value hit the Power BI character limit', async () => {
        renderApp({
            dataView: tableDataView([{ displayName: 'Doc' }], [[stringOfLength(32700)]]),
        });
        const alert = await screen.findByRole('alert');
        expect(alert).toHaveClass('truncation-warning');
        expect(alert).toHaveTextContent('32,767-character limit');
    });

    it('shows no banner for content below the limit', async () => {
        renderApp({ dataView: singleDataView('short content') });
        await waitFor(() => expect(screen.getByText('short content')).toBeInTheDocument());
        expect(screen.queryByRole('alert')).toBeNull();
    });
});

describe('Application — cross-filtering', () => {
    const dataView = () => tableDataView([{ displayName: 'Doc' }], [['# One'], ['# Two']]);

    it('selects the clicked section when cross-filtering is enabled', async () => {
        const { container, selectionManager } = renderApp({
            dataView: dataView(),
            settings: (s) => { s.interactivity.enableCrossFilter = true; },
        });

        const section = await waitFor(() => container.querySelector('[data-section-index="1"]')!);
        await userEvent.click(section);

        expect(selectionManager.select).toHaveBeenCalledTimes(1);
        expect(selectionManager.select.mock.calls[0][0]).toMatchObject({ key: 'row-1' });
        expect(selectionManager.select.mock.calls[0][1]).toBe(false);
    });

    it('passes the multi-select flag when Ctrl is held', async () => {
        const { container, selectionManager } = renderApp({
            dataView: dataView(),
            settings: (s) => { s.interactivity.enableCrossFilter = true; },
        });

        const section = await waitFor(() => container.querySelector('[data-section-index="0"]')!);
        fireEvent.click(section, { ctrlKey: true });

        // select() resolves asynchronously and updates React state
        await waitFor(() => expect(selectionManager.select).toHaveBeenCalled());
        expect(selectionManager.select.mock.calls[0][1]).toBe(true);
        await waitFor(() => expect(section).toHaveClass('section-selected'));
    });

    it('marks the container as cross-filter enabled', async () => {
        const { container } = renderApp({
            dataView: dataView(),
            settings: (s) => { s.interactivity.enableCrossFilter = true; },
        });
        await waitFor(() => {
            expect(container.querySelector('.markdown-content')).toHaveClass('cross-filter-enabled');
        });
    });

    it('does nothing on click when cross-filtering is off', async () => {
        const { container, selectionManager } = renderApp({ dataView: dataView() });
        const section = await waitFor(() => container.querySelector('[data-section-index="0"]')!);
        await userEvent.click(section);
        expect(selectionManager.select).not.toHaveBeenCalled();
        expect(container.querySelector('.markdown-content')).not.toHaveClass('cross-filter-enabled');
    });

    it('does nothing in measure mode, where there are no selection ids', async () => {
        const { container, selectionManager } = renderApp({
            dataView: tableDataView([{ displayName: 'A' }, { displayName: 'B' }], [['# One', '# Two']]),
            settings: (s) => { s.interactivity.enableCrossFilter = true; },
            withSelectionIds: false,
        });
        const section = await waitFor(() => container.querySelector('[data-section-index="0"]')!);
        await userEvent.click(section);
        expect(selectionManager.select).not.toHaveBeenCalled();
    });
});

describe('Application — tooltips', () => {
    const dataView = () => tableDataView(
        [{ displayName: 'Doc' }, { displayName: 'Sales', markdown: false }],
        [['# One', 100], ['# Two', 200]]
    );

    it('shows the tooltip columns of the hovered row', async () => {
        const { container, host } = renderApp({ dataView: dataView() });
        const section = await waitFor(() => container.querySelector('[data-section-index="1"]')!);

        fireEvent.mouseEnter(section, { clientX: 10, clientY: 20 });

        expect(host.tooltipService.show).toHaveBeenCalledTimes(1);
        expect(host.tooltipService.show.mock.calls[0][0]).toMatchObject({
            coordinates: [10, 20],
            dataItems: [{ displayName: 'Sales', value: '200' }],
        });
    });

    it('hides the tooltip on mouse leave', async () => {
        const { container, host } = renderApp({ dataView: dataView() });
        const section = await waitFor(() => container.querySelector('[data-section-index="0"]')!);

        fireEvent.mouseLeave(section);

        expect(host.tooltipService.hide).toHaveBeenCalledWith({ immediately: true, isTouchEvent: false });
    });

    it('shows nothing when no tooltip columns are bound', async () => {
        const { container, host } = renderApp({
            dataView: tableDataView([{ displayName: 'Doc' }], [['# One'], ['# Two']]),
        });
        const section = await waitFor(() => container.querySelector('[data-section-index="0"]')!);

        fireEvent.mouseEnter(section);

        expect(host.tooltipService.show).not.toHaveBeenCalled();
    });
});

describe('Application — context menu', () => {
    const dataView = () => tableDataView([{ displayName: 'Doc' }], [['# One'], ['# Two']]);

    it('delegates to the native Power BI menu when the copy menu is off', async () => {
        const { container, selectionManager } = renderApp({ dataView: dataView() });
        const section = await waitFor(() => container.querySelector('[data-section-index="0"]')!);

        fireEvent.contextMenu(section, { clientX: 5, clientY: 7 });

        expect(selectionManager.showContextMenu).toHaveBeenCalledTimes(1);
        expect(selectionManager.showContextMenu.mock.calls[0][1]).toEqual({ x: 5, y: 7 });
    });

    it('opens the custom copy menu when enabled', async () => {
        const { container, selectionManager } = renderApp({
            dataView: dataView(),
            settings: (s) => { s.view.enableCopyMenu = true; },
        });
        const section = await waitFor(() => container.querySelector('[data-section-index="0"]')!);

        fireEvent.contextMenu(section, { clientX: 5, clientY: 7 });

        expect(selectionManager.showContextMenu).not.toHaveBeenCalled();
        await waitFor(() => {
            expect(document.querySelector('.custom-context-menu')).toBeInTheDocument();
        });
        expect(screen.getByText('Copy all markdown')).toBeInTheDocument();
    });

    it('copies the section markdown to the clipboard', async () => {
        const { container } = renderApp({
            dataView: dataView(),
            settings: (s) => { s.view.enableCopyMenu = true; },
        });
        const section = await waitFor(() => container.querySelector('[data-section-index="1"]')!);
        fireEvent.contextMenu(section, { clientX: 5, clientY: 7 });

        await userEvent.click(await screen.findByText('Copy section markdown'));

        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('# Two');
        });
    });

    it('falls back to the native menu from the custom menu', async () => {
        const { container, selectionManager } = renderApp({
            dataView: dataView(),
            settings: (s) => { s.view.enableCopyMenu = true; },
        });
        const section = await waitFor(() => container.querySelector('[data-section-index="0"]')!);
        fireEvent.contextMenu(section, { clientX: 5, clientY: 7 });

        await userEvent.click(await screen.findByText('More options…'));

        expect(selectionManager.showContextMenu).toHaveBeenCalledTimes(1);
    });
});

describe('Application — search bar', () => {
    it('is hidden by default', async () => {
        renderApp({ dataView: singleDataView('searchable text') });
        await waitFor(() => expect(screen.getByText('searchable text')).toBeInTheDocument());
        expect(screen.queryByPlaceholderText('Search...')).toBeNull();
    });

    it('highlights matches and reports the count', async () => {
        const { container } = renderApp({
            dataView: singleDataView('alpha beta alpha gamma alpha'),
            settings: (s) => { s.view.useSearchBar = true; },
        });

        const input = await screen.findByPlaceholderText('Search...');
        await userEvent.type(input, 'alpha');

        await waitFor(() => {
            expect(container.querySelectorAll('.search-highlight').length).toBe(3);
        });
        expect(container.textContent).toMatch(/1\s*\/\s*3/);
    });

    it('removes the highlights when the search is cleared', async () => {
        const { container } = renderApp({
            dataView: singleDataView('alpha beta alpha'),
            settings: (s) => { s.view.useSearchBar = true; },
        });

        const input = await screen.findByPlaceholderText('Search...');
        await userEvent.type(input, 'alpha');
        await waitFor(() => expect(container.querySelectorAll('.search-highlight').length).toBe(2));

        await userEvent.clear(input);
        await waitFor(() => expect(container.querySelectorAll('.search-highlight').length).toBe(0));
    });
});
