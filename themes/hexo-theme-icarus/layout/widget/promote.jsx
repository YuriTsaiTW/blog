const { Component } = require('inferno');
const gravatrHelper = require('hexo-util').gravatar;
const { cacheComponent } = require('hexo-component-inferno/lib/util/cache');

class Promote extends Component {
    getDomain (link) {
        const urlObject = new URL(link);
        return urlObject?.origin ?? '';
    }
    
    render() {
        const {
            picture,
            topic,
            description,
            picture_link,
            buyLinks
        } = this.props;
        return <div class="card widget" data-type="promote">
            <div class="card-content">
                <nav class="level">
                    <div class="level-item has-text-centered flex-shrink-1">
                        <div>
                            <a href={picture_link}>
                                <figure class="image is-240x240 mx-auto mb-2">
                                    <img class="picture" src={picture} alt={topic} />
                                </figure>
                            </a>
                            {topic ? <p class="title is-size-4 is-block" style={{'line-height': 'inherit'}}>{topic}</p> : null}
                            {description ? <p class="is-size-6 is-block">{description}</p> : null}
                        </div>
                    </div>
                </nav>
                { buyLinks?.length
                    ? <div class="menu">
                        <h3 class="menu-label">購買連結</h3>
                        <ul class="menu-list">
                            {buyLinks.map(link => {
                                return (<li>
                                    <a class="level is-mobile" href={link.url} target="_blank" rel="noopener">
                                        <span class="level-left">
                                            <span class="level-item">{link.name}</span>
                                        </span>
                                        <span class="level-right">
                                            <span class="level-item tag">{this.getDomain(link.url)}</span>
                                        </span>
                                    </a>
                                </li>);
                            })}
                        </ul>
                      </div>
                    : null }
            </div>
        </div>;
    }
}

Promote.Cacheable = cacheComponent(Promote, 'widget.profile', props => {
    const { site, helper, widget } = props;
    const {
        topic,
        description,
        picture_link,
        links
    } = widget;
    const { url_for } = helper;

    const buyLinks = links ? Object.keys(links).map(name => {
        const link = links[name];
        return {
            name,
            url: url_for(link)
        };
    }) : null;

    return {
        picture: url_for('/img/book.png'),
        topic,
        description,
        picture_link,
        buyLinks
    };
});

module.exports = Promote;
