const { Component } = require('inferno');
const { URL } = require('url');
const { cacheComponent } = require('hexo-component-inferno/lib/util/cache');

class BookLinks extends Component {
    render() {
        const { title, image, links } = this.props;

        return <div class="card widget" data-type="book-links">
            <div class="card-content">
                <div class="menu">
                    <h3 class="menu-label">{title}</h3>
                    {image ? <div style={{ 'text-align': 'center', 'margin-bottom': '0.75rem' }}>
                        <img src={image} alt={title} style={{ 'max-height': '160px', 'width': 'auto', 'border-radius': '6px' }} />
                    </div> : null}
                    <ul class="menu-list">
                        {Object.keys(links).map(name => {
                            const link = typeof links[name] === 'string'
                                ? { link: links[name] }
                                : links[name];
                            let hostname;
                            try { hostname = new URL(link.link).hostname; } catch (e) {}

                            return <li>
                                <a class="level is-mobile" href={link.link}
                                    target="_blank" rel="noopener">
                                    <span class="level-left">
                                        <span class="level-item">{name}</span>
                                    </span>
                                    {hostname && !link.hide_hostname
                                        ? <span class="level-right">
                                            <span class="level-item tag">{hostname}</span>
                                        </span>
                                        : null}
                                </a>
                            </li>;
                        })}
                    </ul>
                </div>
            </div>
        </div>;
    }
}

BookLinks.Cacheable = cacheComponent(BookLinks, 'widget.book_links', props => {
    const { helper, widget } = props;
    if (!widget.links || !Object.keys(widget.links).length) {
        return null;
    }
    return {
        title: widget.title || helper.__('widget.links'),
        image: widget.image ? helper.url_for(widget.image) : null,
        links: widget.links
    };
});

module.exports = BookLinks;
