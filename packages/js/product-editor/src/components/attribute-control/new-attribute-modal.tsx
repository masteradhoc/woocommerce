/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useState,
	createElement,
	Fragment,
	useEffect,
} from '@wordpress/element';
import { resolveSelect } from '@wordpress/data';
import { trash } from '@wordpress/icons';
import {
	Form,
	__experimentalSelectControlMenuSlot as SelectControlMenuSlot,
} from '@woocommerce/components';
import {
	EXPERIMENTAL_PRODUCT_ATTRIBUTE_TERMS_STORE_NAME,
	ProductAttribute,
	ProductAttributeTerm,
} from '@woocommerce/data';
import { recordEvent } from '@woocommerce/tracks';
import {
	Button,
	Modal,
	Notice,
	// @ts-expect-error ConfirmDialog is not part of the typescript definition yet.
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { AttributeInputField } from '../attribute-input-field';
import {
	AttributeTermInputField,
	CustomAttributeTermInputField,
} from '../attribute-term-input-field';
import { EnhancedProductAttribute } from '../../hooks/use-product-attributes';
import { getProductAttributeObject } from './utils';

type NewAttributeModalProps = {
	title?: string;
	description?: string | React.ReactElement;
	notice?: string;
	attributeLabel?: string;
	valueLabel?: string;
	attributePlaceholder?: string;
	termPlaceholder?: string;
	removeLabel?: string;
	addAnotherAccessibleLabel?: string;
	addAnotherLabel?: string;
	cancelLabel?: string;
	addAccessibleLabel?: string;
	addLabel?: string;
	confirmMessage?: string;
	confirmCancelLabel?: string;
	confirmConfirmLabel?: string;
	onCancel: () => void;
	onAdd: ( newCategories: EnhancedProductAttribute[] ) => void;
	selectedAttributeIds?: number[];
	createNewAttributesAsGlobal?: boolean;
	disabledAttributeIds?: number[];
	disabledAttributeMessage?: string;
	termsAutoSelection?: 'first' | 'all';
	defaultVisibility?: boolean;
};

type AttributeForm = {
	attributes: Array< EnhancedProductAttribute | null >;
};

export const NewAttributeModal: React.FC< NewAttributeModalProps > = ( {
	title = __( 'Add attributes', 'woocommerce' ),
	description = '',
	notice = __(
		'By default, attributes are filterable and visible on the product page. You can change these settings for each attribute separately later.',
		'woocommerce'
	),
	attributeLabel = __( 'Attribute', 'woocommerce' ),
	valueLabel = __( 'Values', 'woocommerce' ),
	attributePlaceholder = __( 'Search or create attribute', 'woocommerce' ),
	termPlaceholder = __( 'Search or create value', 'woocommerce' ),
	removeLabel = __( 'Remove attribute', 'woocommerce' ),
	addAnotherAccessibleLabel = __( 'Add another attribute', 'woocommerce' ),
	addAnotherLabel = __( '+ Add another', 'woocommerce' ),
	cancelLabel = __( 'Cancel', 'woocommerce' ),
	addAccessibleLabel = __( 'Add attributes', 'woocommerce' ),
	addLabel = __( 'Add', 'woocommerce' ),
	confirmMessage = __(
		'You have some attributes added to the list, are you sure you want to cancel?',
		'woocommerce'
	),
	confirmCancelLabel = __( 'No thanks', 'woocommerce' ),
	confirmConfirmLabel = __( 'Yes please!', 'woocommerce' ),
	onCancel,
	onAdd,
	selectedAttributeIds = [],
	createNewAttributesAsGlobal = false,
	disabledAttributeIds = [],
	disabledAttributeMessage = __(
		'Already used in Attributes',
		'woocommerce'
	),
	termsAutoSelection,
	defaultVisibility = false,
} ) => {
	const scrollAttributeIntoView = ( index: number ) => {
		setTimeout( () => {
			const attributeRow = document.querySelector(
				`.woocommerce-new-attribute-modal__table-row-${ index }`
			);
			attributeRow?.scrollIntoView( { behavior: 'smooth' } );
		}, 0 );
	};
	const [ showConfirmClose, setShowConfirmClose ] = useState( false );
	const addAnother = (
		values: AttributeForm,
		setValue: (
			name: string,
			value: AttributeForm[ keyof AttributeForm ]
		) => void
	) => {
		setValue( 'attributes', [ ...values.attributes, null ] );
		scrollAttributeIntoView( values.attributes.length );
	};

	const hasTermsOrOptions = ( attribute: EnhancedProductAttribute ) => {
		return (
			( attribute.terms && attribute.terms.length > 0 ) ||
			( attribute.options && attribute.options.length > 0 )
		);
	};

	const isGlobalAttribute = ( attribute: EnhancedProductAttribute ) => {
		return attribute.id !== 0;
	};

	const mapTermsToOptions = ( terms: ProductAttributeTerm[] | undefined ) => {
		if ( ! terms ) {
			return [];
		}

		return terms.map( ( term ) => term.name );
	};

	const getOptions = ( attribute: EnhancedProductAttribute ) => {
		return isGlobalAttribute( attribute )
			? mapTermsToOptions( attribute.terms )
			: attribute.options;
	};

	const isAttributeFilledOut = (
		attribute: EnhancedProductAttribute | null
	): attribute is EnhancedProductAttribute => {
		return (
			attribute !== null &&
			attribute.name.length > 0 &&
			hasTermsOrOptions( attribute )
		);
	};

	const getVisibleOrTrue = ( attribute: EnhancedProductAttribute ) =>
		attribute.visible !== undefined ? attribute.visible : defaultVisibility;

	const onAddingAttributes = ( values: AttributeForm ) => {
		const newAttributesToAdd: EnhancedProductAttribute[] = [];
		values.attributes.forEach( ( attr ) => {
			if ( isAttributeFilledOut( attr ) ) {
				newAttributesToAdd.push( {
					...attr,
					visible: getVisibleOrTrue( attr ),
					options: getOptions( attr ),
				} );
			}
		} );
		onAdd( newAttributesToAdd );
	};

	const onRemove = (
		index: number,
		values: AttributeForm,
		setValue: (
			name: string,
			value: AttributeForm[ keyof AttributeForm ]
		) => void
	) => {
		recordEvent(
			'product_add_attributes_modal_remove_attribute_button_click'
		);
		if ( values.attributes.length > 1 ) {
			setValue(
				'attributes',
				values.attributes.filter( ( val, i ) => i !== index )
			);
		} else {
			setValue( `attributes[${ index }]`, [ null ] );
		}
	};

	const focusValueField = ( index: number ) => {
		setTimeout( () => {
			const valueInputField: HTMLInputElement | null =
				document.querySelector(
					'.woocommerce-new-attribute-modal__table-row-' +
						index +
						' .woocommerce-new-attribute-modal__table-attribute-value-column .woocommerce-experimental-select-control__input'
				);
			if ( valueInputField ) {
				valueInputField.focus();
			}
		}, 0 );
	};

	const onClose = ( values: AttributeForm ) => {
		const hasValuesSet = values.attributes.some(
			( value ) =>
				value !== null && value?.terms && value?.terms.length > 0
		);
		if ( hasValuesSet ) {
			setShowConfirmClose( true );
		} else {
			onCancel();
		}
	};

	useEffect( function focusFirstAttributeField() {
		const firstAttributeFieldLabel =
			document.querySelector< HTMLLabelElement >(
				'.woocommerce-new-attribute-modal__table-row .woocommerce-attribute-input-field label'
			);
		const timeoutId = setTimeout( () => {
			firstAttributeFieldLabel?.focus();
		}, 100 );

		return () => clearTimeout( timeoutId );
	}, [] );

	return (
		<>
			<Form< AttributeForm >
				initialValues={ {
					attributes: [ null ],
				} }
			>
				{ ( {
					values,
					setValue,
				}: {
					values: AttributeForm;
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					setValue: ( name: string, value: any ) => void;
				} ) => {
					function getAttributeOnChange( index: number ) {
						return function handleAttributeChange(
							value?:
								| Omit<
										ProductAttribute,
										'position' | 'visible' | 'variation'
								  >
								| string
						) {
							if (
								termsAutoSelection &&
								value &&
								! ( typeof value === 'string' )
							) {
								resolveSelect(
									EXPERIMENTAL_PRODUCT_ATTRIBUTE_TERMS_STORE_NAME
								)
									.getProductAttributeTerms<
										ProductAttributeTerm[]
									>( {
										// Send search parameter as empty to avoid a second
										// request when focusing the attribute-term-input-field
										// which perform the same request to get all the terms
										search: '',
										attribute_id: value.id,
									} )
									.then( ( terms ) => {
										const selectedAttribute =
											getProductAttributeObject(
												value
											) as EnhancedProductAttribute;
										if ( termsAutoSelection === 'all' ) {
											selectedAttribute.terms = terms;
										} else if ( terms.length > 0 ) {
											selectedAttribute.terms = [
												terms[ 0 ],
											];
										}
										setValue( 'attributes[' + index + ']', {
											...selectedAttribute,
										} );
										focusValueField( index );
									} );
							} else {
								setValue(
									'attributes[' + index + ']',
									value && getProductAttributeObject( value )
								);
								if ( value ) {
									focusValueField( index );
								}
							}
						};
					}

					return (
						<Modal
							title={ title }
							onRequestClose={ (
								event:
									| React.KeyboardEvent< Element >
									| React.MouseEvent< Element >
									| React.FocusEvent< Element >
							) => {
								if ( ! event.isPropagationStopped() ) {
									onClose( values );
								}
							} }
							className="woocommerce-new-attribute-modal"
						>
							{ notice && (
								<Notice isDismissible={ false }>
									<p>{ notice }</p>
								</Notice>
							) }

							{ description && <p>{ description }</p> }

							<div className="woocommerce-new-attribute-modal__body">
								<table className="woocommerce-new-attribute-modal__table">
									<thead>
										<tr className="woocommerce-new-attribute-modal__table-header">
											<th>{ attributeLabel }</th>
											<th>{ valueLabel }</th>
										</tr>
									</thead>
									<tbody>
										{ values.attributes.map(
											( attribute, index ) => (
												<tr
													key={ index }
													className={ `woocommerce-new-attribute-modal__table-row woocommerce-new-attribute-modal__table-row-${ index }` }
												>
													<td className="woocommerce-new-attribute-modal__table-attribute-column">
														<AttributeInputField
															placeholder={
																attributePlaceholder
															}
															value={ attribute }
															label={
																attributeLabel
															}
															onChange={ getAttributeOnChange(
																index
															) }
															ignoredAttributeIds={ [
																...selectedAttributeIds,
																...values.attributes
																	.map(
																		(
																			attr
																		) =>
																			attr?.id
																	)
																	.filter(
																		(
																			attrId
																		): attrId is number =>
																			attrId !==
																			undefined
																	),
															] }
															createNewAttributesAsGlobal={
																createNewAttributesAsGlobal
															}
															disabledAttributeIds={
																disabledAttributeIds
															}
															disabledAttributeMessage={
																disabledAttributeMessage
															}
														/>
													</td>
													<td className="woocommerce-new-attribute-modal__table-attribute-value-column">
														{ ! attribute ||
														attribute.id !== 0 ? (
															<AttributeTermInputField
																placeholder={
																	termPlaceholder
																}
																disabled={
																	attribute
																		? ! attribute.id
																		: true
																}
																attributeId={
																	attribute
																		? attribute.id
																		: undefined
																}
																value={
																	attribute ===
																	null
																		? []
																		: attribute.terms
																}
																label={
																	valueLabel
																}
																onChange={ (
																	val
																) =>
																	setValue(
																		'attributes[' +
																			index +
																			'].terms',
																		val
																	)
																}
															/>
														) : (
															<CustomAttributeTermInputField
																placeholder={
																	termPlaceholder
																}
																disabled={
																	! attribute.name
																}
																value={
																	attribute.options
																}
																label={
																	valueLabel
																}
																onChange={ (
																	val
																) =>
																	setValue(
																		'attributes[' +
																			index +
																			'].options',
																		val
																	)
																}
															/>
														) }
													</td>
													<td className="woocommerce-new-attribute-modal__table-attribute-trash-column">
														<Button
															icon={ trash }
															disabled={
																values
																	.attributes
																	.length ===
																	1 &&
																values
																	.attributes[ 0 ] ===
																	null
															}
															label={
																removeLabel
															}
															onClick={ () =>
																onRemove(
																	index,
																	values,
																	setValue
																)
															}
														></Button>
													</td>
												</tr>
											)
										) }
									</tbody>
								</table>
							</div>
							<div>
								<Button
									className="woocommerce-new-attribute-modal__add-attribute"
									variant="tertiary"
									label={ addAnotherAccessibleLabel }
									onClick={ () => {
										recordEvent(
											'product_add_attributes_modal_add_another_attribute_button_click'
										);
										addAnother( values, setValue );
									} }
								>
									{ addAnotherLabel }
								</Button>
							</div>
							<div className="woocommerce-new-attribute-modal__buttons">
								<Button
									isSecondary
									label={ cancelLabel }
									onClick={ () => onClose( values ) }
								>
									{ cancelLabel }
								</Button>
								<Button
									isPrimary
									label={ addAccessibleLabel }
									disabled={
										values.attributes.length === 1 &&
										values.attributes[ 0 ] === null
									}
									onClick={ () =>
										onAddingAttributes( values )
									}
								>
									{ addLabel }
								</Button>
							</div>
						</Modal>
					);
				} }
			</Form>
			{ /* Add slot so select control menu renders correctly within Modal */ }
			<SelectControlMenuSlot />
			{ showConfirmClose && (
				<ConfirmDialog
					cancelButtonText={ confirmCancelLabel }
					confirmButtonText={ confirmConfirmLabel }
					onCancel={ () => setShowConfirmClose( false ) }
					onConfirm={ onCancel }
				>
					{ confirmMessage }
				</ConfirmDialog>
			) }
		</>
	);
};
