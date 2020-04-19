describe('suite sync', () => {
    it('test sync',
        () => {
            browser.url('http://localhost:3100');
            expect(browser.getTitle()).to.contain('4Minitz');
        });
});
