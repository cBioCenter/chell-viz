// ~bb-viz~
// Component Menu Bar
// Visualization for UI elements to appear on the top of a ComponentCard.
// ~bb-viz~

import * as React from 'react';
import {
  Button,
  ButtonProps,
  Checkbox,
  Dropdown,
  Grid,
  Icon,
  Label,
  Menu,
  MenuItemProps,
  Popup,
  PopupProps,
  SemanticICONS,
} from 'semantic-ui-react';

import {
  BioblocksRadioGroup,
  BioblocksRangeSlider,
  BioblocksSlider,
  ConfigAccordion,
} from '~bioblocks-viz~/component/widget';
import {
  BioblocksWidgetConfig,
  ButtonGroupWidgetConfig,
  ButtonWidgetConfig,
  CheckboxWidgetConfig,
  CONFIGURATION_COMPONENT_TYPE,
  DropDownWidgetConfig,
  LabelWidgetConfig,
  RadioWidgetConfig,
  RangeSliderWidgetConfig,
  SliderWidgetConfig,
} from '~bioblocks-viz~/data';
import { EMPTY_FUNCTION } from '~bioblocks-viz~/helper';

export interface IComponentMenuBarProps {
  componentName: string;
  height: number | string;
  isExpanded: boolean;
  iconSrc: string;
  menuItems: Array<IComponentMenuBarItem<IButtonType | IPopupType>>;
  opacity: number;
  width: number | string;
  onExpandToggleCb?(): void;
}

export interface IComponentMenuBarState {
  iconUrl: string;
  isHovered: boolean;
}

export interface IButtonType {
  name: 'BUTTON';
  props?: ButtonProps;
  onClick(...args: any[]): any;
}

export interface IPopupType {
  configs?: { [key: string]: BioblocksWidgetConfig[] };
  name: 'POPUP';
  props?: PopupProps;
}

export interface IComponentMenuBarItem<T = IPopupType> {
  component: T;
  description: string;
  iconName?: SemanticICONS;
}

export const DEFAULT_POPUP_PROPS: Partial<PopupProps> = {
  closeOnPortalMouseLeave: false,
  closeOnTriggerClick: true,
  closeOnTriggerMouseLeave: false,
  hoverable: false,
  openOnTriggerClick: true,
  openOnTriggerFocus: false,
  openOnTriggerMouseEnter: false,
  position: 'bottom left',
  style: { marginTop: 0, maxHeight: '350px', overflow: 'auto', zIndex: 3 },
};

export class ComponentMenuBar extends React.Component<IComponentMenuBarProps, IComponentMenuBarState> {
  public static defaultProps = {
    height: '100%',
    iconSrc: 'assets/icons/bio-blocks-icon.svg',
    isExpanded: false,
    menuItems: [],
    opacity: 0.85,
    width: '100%',
  };

  constructor(props: IComponentMenuBarProps) {
    super(props);
    this.state = {
      iconUrl: 'assets/icons/bio-blocks-icon.svg',
      isHovered: false,
    };
  }

  public async componentDidMount() {
    const { iconSrc } = this.props;
    const result = await fetch(iconSrc);
    this.setState({
      iconUrl: result.url,
    });
  }

  public render() {
    const { componentName, height, iconSrc, isExpanded, menuItems, onExpandToggleCb } = this.props;
    const { iconUrl } = this.state;

    return (
      <div onMouseEnter={this.onMenuEnter} onMouseLeave={this.onMenuLeave}>
        <Menu secondary={true} style={{ margin: 0, height }}>
          {this.renderComponentTitle(componentName, iconSrc, iconUrl)}
          {this.renderComponentRightMenu()}
        </Menu>
      </div>
    );
  }

  protected getPopupMenuItem = (item: IComponentMenuBarItem, key: string, aTriggerElement?: JSX.Element) => {
    const { opacity } = this.props;

    const trigger = aTriggerElement ? (
      aTriggerElement
    ) : (
      <Icon fitted={true} name={item.iconName ? item.iconName : 'setting'} />
    );
    // We are separating the style to prevent a bug where the popup arrow does not display if overflow is set.
    const { style, ...combinedProps } = { ...DEFAULT_POPUP_PROPS, ...item.component.props };

    return item.component.configs ? (
      <Popup key={`${key}-popup`} wide={true} {...combinedProps} style={{ opacity }} trigger={trigger}>
        <ConfigAccordion configs={this.renderConfigs(item.component.configs)} gridStyle={style} title={'Config'} />
      </Popup>
    ) : (
      <Popup key={`${key}-popup`} {...combinedProps} style={{ opacity }} trigger={trigger} />
    );
  };

  protected getButtonMenuItem = (item: IComponentMenuBarItem<IButtonType>) => {
    let validButtonProps = {};
    if (item.component.props) {
      const { color, size, ...rest } = item.component.props;
      validButtonProps = rest;
    }

    return <Icon fitted={true} name={item.iconName ? item.iconName : 'setting'} {...validButtonProps} />;
  };

  protected onMenuEnter = () => {
    this.setState({
      isHovered: true,
    });
  };

  protected onMenuLeave = () => {
    this.setState({
      isHovered: false,
    });
  };

  protected renderComponentRightMenu = () => {
    const { componentName, isExpanded, menuItems, onExpandToggleCb } = this.props;

    return (
      <Menu.Item fitted={'horizontally'} position={'right'}>
        <Menu secondary={true}>
          {this.renderMenuItems(menuItems, componentName)}
          <Menu.Item style={{ flexDirection: 'column' }}>
            <Icon
              name={isExpanded ? 'compress' : 'expand arrows alternate'}
              onClick={onExpandToggleCb}
              style={{ margin: 0 }}
            />
            {this.renderMenuIconText(isExpanded ? 'Close' : 'Expand')}
          </Menu.Item>
        </Menu>
      </Menu.Item>
    );
  };

  protected renderComponentTitle = (componentName: string, iconSrc: string, iconUrl: string) => {
    return (
      <Menu secondary={true} widths={6} fluid={false} style={{ width: 'auto' }}>
        <Menu.Item fitted={'horizontally'} style={{ margin: 0, padding: 0 }}>
          {iconSrc && (
            <img alt={'component icon'} src={iconUrl} style={{ height: '32px', padding: '2px', width: '32px' }} />
          )}
          {componentName}
        </Menu.Item>
      </Menu>
    );
  };
  protected renderConfigs = (configs: { [key: string]: BioblocksWidgetConfig[] }) => {
    return Object.keys(configs).map(configKey => ({
      [configKey]: configs[configKey].map((config, configIndex) => (
        <Grid.Row
          columns={1}
          key={`menu-bar-${configKey}-row-${configIndex}`}
          style={{ padding: '5px 0', width: '100%' }}
        >
          {this.renderSingleConfig(config, `${configKey}-row-${configIndex}`)}
        </Grid.Row>
      )),
    }));
  };

  protected renderConfigurationButton(config: ButtonWidgetConfig, id: string) {
    return (
      <Button compact={true} key={id} onClick={config.onClick} style={config.style}>
        {config.icon && <Icon name={config.icon} />}
        {config.name}
      </Button>
    );
  }

  protected renderConfigurationButtonGroup(config: ButtonGroupWidgetConfig, id: string) {
    return (
      <Grid padded={true} style={{ padding: 'initial 0' }}>
        <Grid.Row columns={2}>
          <Grid.Column width={9}>{config.name}</Grid.Column>
          <Grid.Column width={3}>
            <Button.Group>
              {config.options.map((singleConfig, index) => (
                <Button icon={singleConfig} key={`${id}-${index}`} style={config.style} basic={true} compact={true} />
              ))}
            </Button.Group>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }

  protected renderConfigurationCheckbox(config: CheckboxWidgetConfig, id: string) {
    return (
      <Checkbox key={id} checked={config.checked} label={config.name} onChange={config.onChange} style={config.style} />
    );
  }

  protected renderConfigurationDropDown(config: DropDownWidgetConfig, id: string) {
    return <Dropdown key={id} onChange={config.onChange} options={config.options} />;
  }

  protected renderConfigurationLabel(config: LabelWidgetConfig, id: string) {
    return (
      <Label basic={true} key={id} style={config.style} color={'orange'}>
        {config.name}
      </Label>
    );
  }

  protected renderConfigurationRadioButton(config: RadioWidgetConfig, id: string) {
    return (
      <BioblocksRadioGroup
        defaultOption={config.defaultOption}
        id={id}
        key={id}
        options={config.options}
        onChange={config.onChange}
        selectedOption={config.current}
        style={config.style}
        title={config.name}
      />
    );
  }

  protected renderConfigurationRangeSlider(config: RangeSliderWidgetConfig, id: string) {
    return (
      <BioblocksRangeSlider
        key={id}
        label={config.name}
        defaultValue={config.range.defaultRange}
        max={config.range.max}
        min={config.range.min}
        onAfterChange={config.onAfterChange}
        onChange={config.onChange}
        style={{ padding: '2px 0 3px 18px', width: '100%', ...config.style }}
        value={config.range.current}
      />
    );
  }

  protected renderConfigurationSlider(config: SliderWidgetConfig, id: string) {
    return (
      <BioblocksSlider
        key={id}
        label={config.name}
        defaultValue={config.values.defaultValue}
        marks={config.marks}
        max={config.values.max}
        min={config.values.min}
        onAfterChange={config.onAfterChange}
        onChange={config.onChange}
        step={config.step}
        style={{ padding: '2px 0 3px 18px', width: '100%', ...config.style }}
        value={config.values.current}
      />
    );
  }

  protected renderMenuIconText(text: string) {
    const { isHovered } = this.state;

    return <span style={{ fontSize: '11px', visibility: isHovered ? 'visible' : 'hidden' }}>{text}</span>;
  }

  protected renderMenuItems(items: Array<IComponentMenuBarItem<IButtonType | IPopupType>>, componentName: string) {
    return items.map((item, menuBarIndex) => {
      const key = `${componentName}-menu-item-${menuBarIndex}`;
      if (item.component.name === 'POPUP') {
        const trigger = (
          <Menu.Item
            active={item.component.props ? (item.component.props.active as boolean) : undefined}
            key={`${key}-trigger`}
            style={{ flexDirection: 'column' }}
          >
            <Icon fitted={true} name={item.iconName ? item.iconName : 'setting'} />
            {this.renderMenuIconText(item.description)}
          </Menu.Item>
        );

        return this.getPopupMenuItem(item as IComponentMenuBarItem, key, trigger);
      } else {
        const menuItemChild = this.getButtonMenuItem(item as IComponentMenuBarItem<IButtonType>);

        return (
          menuItemChild && (
            <Menu.Item
              active={item.component.props ? (item.component.props.active as boolean) : undefined}
              key={key}
              style={{ flexDirection: 'column' }}
              onClick={'onClick' in item.component ? item.component.onClick : EMPTY_FUNCTION}
            >
              {menuItemChild}
              {this.renderMenuIconText(item.description)}
            </Menu.Item>
          )
        );
      }
    });
  }

  protected renderSingleConfig(config: BioblocksWidgetConfig, id: string) {
    switch (config.type) {
      case CONFIGURATION_COMPONENT_TYPE.BUTTON:
        return this.renderConfigurationButton(config, `button-${id}`);
      case CONFIGURATION_COMPONENT_TYPE.BUTTON_GROUP:
        return this.renderConfigurationButtonGroup(config, `button-${id}`);
      case CONFIGURATION_COMPONENT_TYPE.CHECKBOX:
        return this.renderConfigurationCheckbox(config, `label-${id}`);
      case CONFIGURATION_COMPONENT_TYPE.DROP_DOWN:
        return this.renderConfigurationDropDown(config, `label-${id}`);
      case CONFIGURATION_COMPONENT_TYPE.LABEL:
        return this.renderConfigurationLabel(config, `label-${id}`);
      case CONFIGURATION_COMPONENT_TYPE.RADIO:
        return this.renderConfigurationRadioButton(config, `radio-${id}`);
      case CONFIGURATION_COMPONENT_TYPE.RANGE_SLIDER:
        return this.renderConfigurationRangeSlider(config, `range-slider-${id}`);
      case CONFIGURATION_COMPONENT_TYPE.SLIDER:
        return this.renderConfigurationSlider(config, `slider-${id}`);
      default: {
        return `configuration for ${id}`;
      }
    }
  }
}
