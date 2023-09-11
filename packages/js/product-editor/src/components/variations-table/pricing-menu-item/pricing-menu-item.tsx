/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { recordEvent } from '@woocommerce/tracks';
import { Dropdown, MenuGroup, MenuItem } from '@wordpress/components';
import { createElement } from '@wordpress/element';
import { chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { TRACKS_SOURCE } from '../../../constants';
import { handlePrompt } from '../../../utils/handle-prompt';
import { VariationActionsMenuItemProps } from '../types';
import { SetListPriceMenuItem } from '../set-list-price-menu-item';

function isPercentage( value: string ) {
	return value.endsWith( '%' );
}

function parsePercentage( value: string ) {
	const stringNumber = value.substring( 0, value.length - 1 );
	if ( Number.isNaN( Number( stringNumber ) ) ) {
		return undefined;
	}
	return Number( stringNumber );
}

function addFixedOrPercentage(
	value: string,
	fixedOrPercentage: string,
	increaseOrDecrease: 1 | -1 = 1
) {
	if ( isPercentage( fixedOrPercentage ) ) {
		if ( Number.isNaN( Number( value ) ) ) {
			return 0;
		}
		const percentage = parsePercentage( fixedOrPercentage );
		if ( percentage === undefined ) {
			return Number( value );
		}
		return (
			Number( value ) +
			Number( value ) * ( percentage / 100 ) * increaseOrDecrease
		);
	}
	if ( Number.isNaN( Number( value ) ) ) {
		if ( Number.isNaN( Number( fixedOrPercentage ) ) ) {
			return undefined;
		}
		return Number( fixedOrPercentage );
	}
	return Number( value ) + Number( fixedOrPercentage ) * increaseOrDecrease;
}

export function PricingMenuItem( {
	selection,
	onChange,
	onClose,
}: VariationActionsMenuItemProps ) {
	const ids = Array.isArray( selection )
		? selection.map( ( { id } ) => id )
		: selection.id;

	return (
		<Dropdown
			position="middle right"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<MenuItem
					onClick={ () => {
						recordEvent( 'product_variations_menu_pricing_click', {
							source: TRACKS_SOURCE,
							variation_id: ids,
						} );
						onToggle();
					} }
					aria-expanded={ isOpen }
					icon={ chevronRight }
					iconPosition="right"
				>
					{ __( 'Pricing', 'woocommerce' ) }
				</MenuItem>
			) }
			renderContent={ () => (
				<div className="components-dropdown-menu__menu">
					<MenuGroup label={ __( 'List price', 'woocommerce' ) }>
						<SetListPriceMenuItem
							selection={ selection }
							onChange={ onChange }
							onClose={ onClose }
						/>
						<MenuItem
							onClick={ () => {
								recordEvent(
									'product_variations_menu_pricing_select',
									{
										source: TRACKS_SOURCE,
										action: 'list_price_increase',
										variation_id: ids,
									}
								);
								handlePrompt( {
									message: __(
										'Enter a value (fixed or %)',
										'woocommerce'
									),
									onOk( value ) {
										recordEvent(
											'product_variations_menu_pricing_update',
											{
												source: TRACKS_SOURCE,
												action: 'list_price_increase',
												variation_id: ids,
											}
										);
										if ( Array.isArray( selection ) ) {
											onChange(
												selection.map(
													( {
														id,
														regular_price,
													} ) => ( {
														id,
														regular_price:
															addFixedOrPercentage(
																regular_price,
																value
															)?.toFixed( 2 ),
													} )
												)
											);
										} else {
											onChange( {
												regular_price:
													addFixedOrPercentage(
														selection.regular_price,
														value
													)?.toFixed( 2 ),
											} );
										}
									},
								} );
								onClose();
							} }
						>
							{ __( 'Increase list price', 'woocommerce' ) }
						</MenuItem>
						<MenuItem
							onClick={ () => {
								recordEvent(
									'product_variations_menu_pricing_select',
									{
										source: TRACKS_SOURCE,
										action: 'list_price_decrease',
										variation_id: ids,
									}
								);
								handlePrompt( {
									message: __(
										'Enter a value (fixed or %)',
										'woocommerce'
									),
									onOk( value ) {
										recordEvent(
											'product_variations_menu_pricing_update',
											{
												source: TRACKS_SOURCE,
												action: 'list_price_increase',
												variation_id: ids,
											}
										);
										if ( Array.isArray( selection ) ) {
											onChange(
												selection.map(
													( {
														id,
														regular_price,
													} ) => ( {
														id,
														regular_price:
															addFixedOrPercentage(
																regular_price,
																value,
																-1
															)?.toFixed( 2 ),
													} )
												)
											);
										} else {
											onChange( {
												regular_price:
													addFixedOrPercentage(
														selection.regular_price,
														value,
														-1
													)?.toFixed( 2 ),
											} );
										}
									},
								} );
								onClose();
							} }
						>
							{ __( 'Decrease list price', 'woocommerce' ) }
						</MenuItem>
					</MenuGroup>
					<MenuGroup label={ __( 'Sale price', 'woocommerce' ) }>
						<MenuItem
							onClick={ () => {
								recordEvent(
									'product_variations_menu_pricing_select',
									{
										source: TRACKS_SOURCE,
										action: 'sale_price_set',
										variation_id: ids,
									}
								);
								handlePrompt( {
									onOk( value ) {
										recordEvent(
											'product_variations_menu_pricing_update',
											{
												source: TRACKS_SOURCE,
												action: 'sale_price_set',
												variation_id: ids,
											}
										);
										if ( Array.isArray( selection ) ) {
											onChange(
												selection.map( ( { id } ) => ( {
													id,
													sale_price: value,
												} ) )
											);
										} else {
											onChange( {
												sale_price: value,
											} );
										}
									},
								} );
								onClose();
							} }
						>
							{ __( 'Set sale price', 'woocommerce' ) }
						</MenuItem>
						<MenuItem
							onClick={ () => {
								recordEvent(
									'product_variations_menu_pricing_select',
									{
										source: TRACKS_SOURCE,
										action: 'sale_price_increase',
										variation_id: ids,
									}
								);
								handlePrompt( {
									message: __(
										'Enter a value (fixed or %)',
										'woocommerce'
									),
									onOk( value ) {
										recordEvent(
											'product_variations_menu_pricing_update',
											{
												source: TRACKS_SOURCE,
												action: 'sale_price_increase',
												variation_id: ids,
											}
										);
										if ( Array.isArray( selection ) ) {
											onChange(
												selection.map(
													( {
														id,
														sale_price,
													} ) => ( {
														id,
														sale_price:
															addFixedOrPercentage(
																sale_price,
																value
															)?.toFixed( 2 ),
													} )
												)
											);
										} else {
											onChange( {
												sale_price:
													addFixedOrPercentage(
														selection.sale_price,
														value
													)?.toFixed( 2 ),
											} );
										}
									},
								} );
								onClose();
							} }
						>
							{ __( 'Increase sale price', 'woocommerce' ) }
						</MenuItem>
						<MenuItem
							onClick={ () => {
								recordEvent(
									'product_variations_menu_pricing_select',
									{
										source: TRACKS_SOURCE,
										action: 'sale_price_decrease',
										variation_id: ids,
									}
								);
								handlePrompt( {
									message: __(
										'Enter a value (fixed or %)',
										'woocommerce'
									),
									onOk( value ) {
										recordEvent(
											'product_variations_menu_pricing_update',
											{
												source: TRACKS_SOURCE,
												action: 'sale_price_decrease',
												variation_id: ids,
											}
										);
										if ( Array.isArray( selection ) ) {
											onChange(
												selection.map(
													( {
														id,
														sale_price,
													} ) => ( {
														id,
														sale_price:
															addFixedOrPercentage(
																sale_price,
																value,
																-1
															)?.toFixed( 2 ),
													} )
												)
											);
										} else {
											onChange( {
												sale_price:
													addFixedOrPercentage(
														selection.sale_price,
														value,
														-1
													)?.toFixed( 2 ),
											} );
										}
									},
								} );
								onClose();
							} }
						>
							{ __( 'Decrease sale price', 'woocommerce' ) }
						</MenuItem>
						<MenuItem
							onClick={ () => {
								recordEvent(
									'product_variations_menu_pricing_select',
									{
										source: TRACKS_SOURCE,
										action: 'sale_price_schedule',
										variation_id: ids,
									}
								);
								handlePrompt( {
									message: __(
										'Sale start date (YYYY-MM-DD format or leave blank)',
										'woocommerce'
									),
									onOk( value ) {
										recordEvent(
											'product_variations_menu_pricing_update',
											{
												source: TRACKS_SOURCE,
												action: 'sale_price_schedule',
												variation_id: ids,
											}
										);
										if ( Array.isArray( selection ) ) {
											onChange(
												selection.map( ( { id } ) => ( {
													id,
													date_on_sale_from_gmt:
														value,
												} ) )
											);
										} else {
											onChange( {
												date_on_sale_from_gmt: value,
											} );
										}
									},
								} );
								handlePrompt( {
									message: __(
										'Sale end date (YYYY-MM-DD format or leave blank)',
										'woocommerce'
									),
									onOk( value ) {
										recordEvent(
											'product_variations_menu_pricing_update',
											{
												source: TRACKS_SOURCE,
												action: 'sale_price_schedule',
												variation_id: ids,
											}
										);
										if ( Array.isArray( selection ) ) {
											onChange(
												selection.map( ( { id } ) => ( {
													id,
													date_on_sale_to_gmt: value,
												} ) )
											);
										} else {
											onChange( {
												date_on_sale_to_gmt: value,
											} );
										}
									},
								} );
								onClose();
							} }
						>
							{ __( 'Schedule sale', 'woocommerce' ) }
						</MenuItem>
					</MenuGroup>
				</div>
			) }
		/>
	);
}
