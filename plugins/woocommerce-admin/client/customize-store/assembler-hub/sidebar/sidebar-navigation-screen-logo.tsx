/* eslint-disable @woocommerce/dependency-group */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useContext, cloneElement } from '@wordpress/element';
import {
	RangeControl,
	ToggleControl,
	DropZone,
	Button,
	Spinner,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';
import { Icon, upload } from '@wordpress/icons';
// @ts-ignore No types for this exist yet.
import { store as coreStore } from '@wordpress/core-data';

// @ts-ignore No types for this exist yet.
import { isBlobURL } from '@wordpress/blob';
import {
	MediaUpload,
	MediaUploadCheck,
	store as blockEditorStore,
	// @ts-ignore No types for this exist yet.
} from '@wordpress/block-editor';
// @ts-ignore No types for this exist yet.
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { SidebarNavigationScreen } from './sidebar-navigation-screen';
import { LogoBlockContext } from '../logo-block-context';

const MIN_SIZE = 20;
const ALLOWED_MEDIA_TYPES = [ 'image' ];

type LogoAttributes = Partial< {
	align: string;
	width: number;
	height: number;
	isLink: boolean;
	linkTarget: string;
	shouldSyncIcon: boolean;
} >;

const useLogoEdit = ( {
	shouldSyncIcon,
	setAttributes,
}: {
	shouldSyncIcon: LogoAttributes[ 'shouldSyncIcon' ];
	setAttributes: ( newAttributes: LogoAttributes ) => void;
} ) => {
	const { siteIconId, mediaUpload } = useSelect( ( select ) => {
		// @ts-ignore No types for this exist yet.
		const { canUser, getEditedEntityRecord } = select( coreStore );
		const _canUserEdit = canUser( 'update', 'settings' );
		const siteSettings = _canUserEdit
			? getEditedEntityRecord( 'root', 'site' )
			: undefined;

		const _siteIconId = siteSettings?.site_icon;
		return {
			siteIconId: _siteIconId,
			// @ts-ignore No types for this exist yet.
			mediaUpload: select( blockEditorStore ).getSettings().mediaUpload,
		};
	}, [] );

	// @ts-ignore No types for this exist yet.
	const { editEntityRecord } = useDispatch( coreStore );

	const setIcon = ( newValue: string | undefined ) =>
		// The new value needs to be `null` to reset the Site Icon.
		editEntityRecord( 'root', 'site', undefined, {
			site_icon: newValue ?? null,
		} );

	const setLogo = (
		newValue: string | undefined,
		shouldForceSync = false
	) => {
		// `shouldForceSync` is used to force syncing when the attribute
		// may not have updated yet.
		if ( shouldSyncIcon || shouldForceSync ) {
			setIcon( newValue );
		}

		editEntityRecord( 'root', 'site', undefined, {
			site_logo: newValue,
		} );
	};

	const onSelectLogo = (
		media: { id: string; url: string },
		shouldForceSync = false
	) => {
		if ( ! media ) {
			return;
		}

		if ( ! media.id && media.url ) {
			// This is a temporary blob image.
			setLogo( undefined );
			return;
		}

		setLogo( media.id, shouldForceSync );
	};

	const onInitialSelectLogo = ( media: { id: string; url: string } ) => {
		// Initialize the syncSiteIcon toggle. If we currently have no site logo and no
		// site icon, automatically sync the logo to the icon.
		if ( shouldSyncIcon === undefined ) {
			const shouldForceSync = ! siteIconId;
			setAttributes( { shouldSyncIcon: shouldForceSync } );

			// Because we cannot rely on the `shouldSyncIcon` attribute to have updated by
			// the time `setLogo` is called, pass an argument to force the syncing.
			onSelectLogo( media, shouldForceSync );
			return;
		}

		onSelectLogo( media );
	};

	const { createErrorNotice } = useDispatch( noticesStore );
	const onUploadError = ( message: string ) => {
		createErrorNotice( message, { type: 'snackbar' } );
	};

	const onFilesDrop = ( filesList: File[] ) => {
		mediaUpload( {
			allowedTypes: [ 'image' ],
			filesList,
			onFileChange( [ image ]: [ { id: string; url: string } ] ) {
				if ( isBlobURL( image?.url ) ) {
					return;
				}
				onInitialSelectLogo( image );
			},
			onError: onUploadError,
		} );
	};

	return {
		onFilesDrop,
		onInitialSelectLogo,
		setIcon,
		siteIconId,
	};
};

// Reference: https://github.com/WordPress/gutenberg/blob/83f3fbc740c97afac3474a6c37098e259191dc2c/packages/block-library/src/site-logo/edit.js#L63
const LogoSettings = ( {
	attributes: { width, isLink, shouldSyncIcon, align = '' },
	canUserEdit,
	naturalWidth,
	naturalHeight,
	setAttributes,
	setIcon,
	logoId,
}: {
	attributes: LogoAttributes;
	setAttributes: ( newAttributes: LogoAttributes ) => void;
	canUserEdit: boolean;
	naturalWidth: number;
	naturalHeight: number;
	setIcon: ( newValue: string | undefined ) => void;
	logoId: string;
} ) => {
	const isLargeViewport = useViewportMatch( 'medium' );
	const isWideAligned = [ 'wide', 'full' ].includes( align );
	const isResizable = ! isWideAligned && isLargeViewport;

	const { maxWidth } = useSelect( ( select ) => {
		// @ts-ignore No types for this exist yet.
		const settings = select( blockEditorStore ).getSettings();
		return {
			maxWidth: settings.maxWidth,
		};
	}, [] );

	// Set the default width to a responsible size.
	// Note that this width is also set in the attached frontend CSS file.
	const defaultWidth = 120;

	const currentWidth = width || defaultWidth;
	const ratio = naturalWidth / naturalHeight;
	const minWidth =
		naturalWidth < naturalHeight ? MIN_SIZE : Math.ceil( MIN_SIZE * ratio );

	// With the current implementation of ResizableBox, an image needs an
	// explicit pixel value for the max-width. In absence of being able to
	// set the content-width, this max-width is currently dictated by the
	// vanilla editor style. The following variable adds a buffer to this
	// vanilla style, so 3rd party themes have some wiggleroom. This does,
	// in most cases, allow you to scale the image beyond the width of the
	// main column, though not infinitely.
	// @todo It would be good to revisit this once a content-width variable
	// becomes available.
	const maxWidthBuffer = maxWidth * 2.5;

	return (
		<div className="woocommerce-customize-store__sidebar-group">
			<div className="woocommerce-customize-store__sidebar-group-header">
				{ __( 'Settings', 'woocommerce' ) }
			</div>
			<RangeControl
				// @ts-ignore No types for this exist yet.
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Image width', 'woocommerce' ) }
				onChange={ ( newWidth ) =>
					setAttributes( { width: newWidth } )
				}
				min={ minWidth }
				max={ maxWidthBuffer }
				initialPosition={ Math.min( defaultWidth, maxWidthBuffer ) }
				value={ currentWidth }
				disabled={ ! isResizable }
			/>
			<ToggleControl
				// @ts-ignore No types for this exist yet.
				__nextHasNoMarginBottom
				label={ __( 'Link logo to homepage', 'woocommerce' ) }
				onChange={ () => {
					setAttributes( { isLink: ! isLink } );
				} }
				checked={ isLink }
			/>
			{ canUserEdit && (
				<>
					<ToggleControl
						// @ts-ignore No types for this exist yet.
						__nextHasNoMarginBottom
						label={ __( 'Use as site icon', 'woocommerce' ) }
						onChange={ ( value: boolean ) => {
							setAttributes( { shouldSyncIcon: value } );
							setIcon( value ? logoId : undefined );
						} }
						checked={ !! shouldSyncIcon }
						help={ __(
							'Site Icons are what you see in browser tabs, bookmark bars, and within the WordPress mobile apps.',
							'woocommerce'
						) }
					/>
				</>
			) }
		</div>
	);
};

const LogoEdit = ( {
	siteLogoId,
	attributes,
	setAttributes,
	mediaItemData,
	isLoading,
	canUserEdit,
}: {
	siteLogoId: string;
	setAttributes: ( newAttributes: LogoAttributes ) => void;
	attributes: LogoAttributes;
	mediaItemData: { id: string; alt_text: string; source_url: string };
	isLoading: boolean;
	canUserEdit: boolean;
} ) => {
	const { alt_text: alt, source_url: logoUrl } = mediaItemData || {};

	const { onFilesDrop, onInitialSelectLogo, setIcon } = useLogoEdit( {
		shouldSyncIcon: attributes.shouldSyncIcon,
		setAttributes,
	} );

	const [ { naturalWidth, naturalHeight }, setNaturalSize ] = useState< {
		naturalWidth?: number;
		naturalHeight?: number;
	} >( {} );

	if ( isLoading ) {
		return (
			<span className="components-placeholder__preview">
				<Spinner />
			</span>
		);
	}

	if ( ! logoUrl ) {
		return (
			<MediaUploadCheck>
				<MediaUpload
					onSelect={ onInitialSelectLogo }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					render={ ( { open }: { open: () => void } ) => (
						<Button
							variant="link"
							onClick={ open }
							className="block-library-site-logo__inspector-upload-container"
						>
							<span>
								<Icon
									icon={ upload }
									size={ 20 }
									className="icon-control"
								/>
							</span>
							<DropZone onFilesDrop={ onFilesDrop } />
						</Button>
					) }
				/>
			</MediaUploadCheck>
		);
	}

	const logoImg = (
		<div className="woocommerce-customize-store__sidebar-logo-container">
			<img
				className="woocommerce-customize-store_custom-logo"
				src={ logoUrl }
				alt={ alt }
				onLoad={ ( event ) => {
					setNaturalSize( {
						naturalWidth: ( event.target as HTMLImageElement )
							.naturalWidth,
						naturalHeight: ( event.target as HTMLImageElement )
							.naturalHeight,
					} );
				} }
			/>
		</div>
	);

	if ( ! naturalHeight || ! naturalWidth ) {
		// Load the image first to get the natural size so we can set the ratio.
		return logoImg;
	}

	return (
		<>
			<MediaUploadCheck>
				<MediaUpload
					onSelect={ onInitialSelectLogo }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					render={ ( { open }: { open: () => void } ) =>
						cloneElement( logoImg, { onClick: open } )
					}
				/>
			</MediaUploadCheck>
			{ !! logoUrl && (
				<LogoSettings
					attributes={ attributes }
					setAttributes={ setAttributes }
					naturalWidth={ naturalWidth }
					naturalHeight={ naturalHeight }
					canUserEdit={ canUserEdit }
					setIcon={ setIcon }
					logoId={ mediaItemData?.id || siteLogoId }
				/>
			) }
		</>
	);
};

export const SidebarNavigationScreenLogo = () => {
	// Get the current logo block client ID and attributes. These are used for the logo settings.
	const {
		logoBlock: { clientId, isLoading: isLogoBlockLoading },
	} = useContext( LogoBlockContext );

	const {
		attributes,
		isAttributesLoading,
	}: {
		attributes: LogoAttributes;
		isAttributesLoading: boolean;
	} = useSelect(
		( select ) => {
			const logoBlocks =
				// @ts-ignore No types for this exist yet.
				select( blockEditorStore ).getBlocksByClientId( clientId );

			const _isAttributesLoading =
				! logoBlocks.length || logoBlocks[ 0 ] === null;

			if ( _isAttributesLoading ) {
				return {
					attributes: {},
					isAttributesLoading: _isAttributesLoading,
				};
			}

			return {
				attributes: logoBlocks[ 0 ].attributes,
				isAttributesLoading: _isAttributesLoading,
			};
		},
		[ clientId ]
	);

	const { siteLogoId, canUserEdit, mediaItemData, isRequestingMediaItem } =
		useSelect( ( select ) => {
			// @ts-ignore No types for this exist yet.
			const { canUser, getEntityRecord, getEditedEntityRecord } =
				select( coreStore );

			const _canUserEdit = canUser( 'update', 'settings' );
			const siteSettings = _canUserEdit
				? getEditedEntityRecord( 'root', 'site' )
				: undefined;
			const siteData = getEntityRecord( 'root', '__unstableBase' );
			const _siteLogoId = _canUserEdit
				? siteSettings?.site_logo
				: siteData?.site_logo;

			const mediaItem =
				_siteLogoId &&
				// @ts-ignore No types for this exist yet.
				select( coreStore ).getMedia( _siteLogoId, {
					context: 'view',
				} );
			const _isRequestingMediaItem =
				_siteLogoId &&
				// @ts-ignore No types for this exist yet.
				! select( coreStore ).hasFinishedResolution( 'getMedia', [
					_siteLogoId,
					{ context: 'view' },
				] );

			return {
				siteLogoId: _siteLogoId,
				canUserEdit: _canUserEdit,
				mediaItemData: mediaItem,
				isRequestingMediaItem: _isRequestingMediaItem,
			};
		}, [] );

	// @ts-ignore No types for this exist yet.
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const setAttributes = ( newAttributes: LogoAttributes ) => {
		if ( ! clientId ) {
			return;
		}
		updateBlockAttributes( clientId, newAttributes );
	};

	const isLoading =
		siteLogoId === undefined ||
		isRequestingMediaItem ||
		isLogoBlockLoading ||
		isAttributesLoading;

	return (
		<SidebarNavigationScreen
			title={ __( 'Add your logo', 'woocommerce' ) }
			description={ __(
				"Ensure your store is on-brand by adding your logo. For best results, upload a SVG or PNG that's a minimum of 300px wide.",
				'woocommerce'
			) }
			content={
				<div className="woocommerce-customize-store__sidebar-logo-content">
					<div className="woocommerce-customize-store__sidebar-group-header">
						{ __( 'Logo', 'woocommerce' ) }
					</div>
					<LogoEdit
						siteLogoId={ siteLogoId }
						attributes={ attributes }
						setAttributes={ setAttributes }
						canUserEdit={ canUserEdit }
						mediaItemData={ mediaItemData }
						isLoading={ isLoading }
					/>
				</div>
			}
		/>
	);
};
