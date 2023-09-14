import styled from 'styled-components'
import { mixin } from '@poap/poap-components'


const doodadBeforeConfigurations = [
    null,
    // configuration for before doodad 1
    { url: '/assets/decorations/doodas-l-1.svg', width: 90, height: 90, left: '0', top: '0', transform: '' },
    // configuration for before doodad 2
    { url: '/assets/decorations/doodas-l-2.svg', width: 90, height: 90, left: '0', top: '50%', transform: 'translateY(-50%)' },
    // configuration for before doodad 3
    { url: '/assets/decorations/doodas-l-2.svg', width: 90, height: 90, left: '0', top: '75%', transform: 'translateY(-75%)' },

]

const doodadAfterConfigurations = [
    null,
    // configuration for after doodad 1
    { url: '/assets/decorations/doodas-r-1.svg', width: 120, height: 128, right: '0', top: '25%', transform: 'translateY(-25%);' },
    // configuration for after doodad 2
    { url: '/assets/decorations/doodas-r-2.svg', width: 120, height: 128, right: '0', top: '25%', transform: 'translateY(-25%);' },

]

export default styled.section`
    position: relative;
    z-index: 1;
    min-height: ${ ( { height } ) => height || 'initial' };
    max-height: 100%;
    max-width: ${ ( { maxWidth } ) => maxWidth || '100%' };
    padding: ${ ( { padding } ) => padding || 'var(--spacing-4) 0 var(--spacing-4) 0' };
    margin: ${ ( { margin } ) => margin || '' };

    ${ mixin.md_up`
        ${ ( { before } ) => before && doodadBeforeConfigurations[before] && `
            &::before {
            position: absolute;
            z-index: 0;
            content: url(${ doodadBeforeConfigurations[before].url });
            width: ${ doodadBeforeConfigurations[before].width }px;
            height: ${ doodadBeforeConfigurations[before].height }px;
            left: ${ doodadBeforeConfigurations[before].left || '0' };
            top:  ${ doodadBeforeConfigurations[before].top || '0' };
            transform: ${ doodadBeforeConfigurations[before].transform || '' };
            }
        ` }
    ` }

    ${ mixin.md_up`
        ${ ( { after } ) => after && doodadAfterConfigurations[after] && `
            &::after {
            position: absolute;
            z-index: 0;
            content: url(${ doodadAfterConfigurations[after].url });
            width: ${ doodadAfterConfigurations[after].width }px;
            height: ${ doodadAfterConfigurations[after].height }px;
            right: ${ doodadAfterConfigurations[after].right || '0' };
            top:  ${ doodadAfterConfigurations[after].top || '0' };
            transform: ${ doodadAfterConfigurations[after].transform || '' };
            }
        ` }
    ` }
`
